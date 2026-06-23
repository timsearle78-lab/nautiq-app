import { streamText, zodSchema, convertToModelMessages, stepCountIs } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";
import { getBoatHealth } from "@/lib/components/health";
import { HELP_SYSTEM_PROMPT } from "@/lib/help-content";

async function logChatError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: { userId?: string; boatId?: string; message: string; stack?: string }
) {
  console.error("[chat error]", opts.message, opts.stack ?? "");
  if (!opts.userId) return; // RLS requires an authenticated user
  await supabase.from("chat_errors").insert({
    user_id: opts.userId,
    boat_id: opts.boatId ?? null,
    error_message: opts.message,
    error_stack: opts.stack ?? null,
  });
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 500 });
  }

  const supabase = await createClient();
  let boatId: string | undefined;
  let userId: string | undefined;

  try {
    const body = await req.json();
    boatId = body.boatId;
    const messages = body.messages;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });
    userId = user.id;

    const { data: boat } = await supabase
      .from("boats")
      .select("id, name")
      .eq("id", boatId)
      .eq("user_id", user.id)
      .single();
    if (!boat) return new Response("Boat not found", { status: 404 });

    const { data: engineHours } = await supabase.rpc("get_boat_engine_hours", {
      p_boat_id: boatId,
    });

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile"),
      stopWhen: stepCountIs(1),
      system: `You are NautIQ, a practical boat assistant for "${boat.name}".
Engine hours: ${engineHours ?? 0}h.

${HELP_SYSTEM_PROMPT}

When the user asks a "how do I" or "how does X work" question about the app, answer it directly in plain conversational text without calling any tool. Keep answers concise and friendly.

TOOL SELECTION RULES — follow these exactly (only for data/action requests, not how-to questions):

1. LOGGING A TRIP: If the owner is telling you about a trip they just did (e.g. "went sailing", "motored for 2 hours", "left marina at 10am", "went racing") → call draftTripLog immediately. Do NOT call getTripHistory.

2. VIEWING PAST TRIPS: Only call getTripHistory if the owner explicitly asks to SEE or SHOW their trips (e.g. "show my trips", "what trips have I done", "trip history").

3. USING A PART: If the owner mentions using/consuming a spare part or says something like "used a part", "used a spare", "I used something" (even without naming it) → call draftInventoryAdjustment. If no specific item is named, pass itemName as an empty string so the user can pick from their full inventory.

4. ADDING/BUYING A PART: If the owner wants to add a new item to inventory, restock, buy, or purchase parts (e.g. "add 5m of rope", "I bought a new filter", "add dyneema rope to inventory") → call draftInventoryAdd.

5. MAINTENANCE QUESTIONS: "what do I need to do", "what's due" → call getUpcomingMaintenance.

6. INVENTORY QUESTIONS: "show my inventory", "what spares do I have" → call getInventoryStatus.

7. BOAT HEALTH: General health questions → call getBoatSummary.

The UI renders tool results as formatted cards automatically — do NOT add any text after calling any tool. The card is the response.`,
      messages: modelMessages,
      onError: async (event) => {
        const err = event.error as Error | undefined;
        await logChatError(supabase, {
          userId,
          boatId,
          message: err?.message ?? String(event.error),
          stack: err?.stack,
        });
      },
      tools: {
        getBoatSummary: {
          description: "Get boat health score, engine hours, and most urgent maintenance",
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            const [health, hoursRes, timelineRes] = await Promise.all([
              getBoatHealth(boatId!),
              supabase.rpc("get_boat_engine_hours", { p_boat_id: boatId }),
              supabase.rpc("get_boat_maintenance_timeline", {
                p_boat_id: boatId,
                p_horizon_days: 90,
              }),
            ]);

            const knownHealth = health.filter((c) => c.risk_score != null);
            const avgRisk =
              knownHealth.length > 0
                ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
                : 0;
            const healthScore = Math.max(0, Math.round(100 - avgRisk));
            const timeline = (timelineRes.data ?? []) as { status: string; component_name: string }[];

            return {
              boatName: boat.name,
              engineHours: hoursRes.data ?? 0,
              healthScore,
              overdueCount: health.filter((c) => c.status === "overdue").length,
              dueSoonCount: health.filter((c) => c.status === "due soon").length,
              urgentItems: health
                .filter((c) => c.status === "overdue")
                .slice(0, 3)
                .map((c) => c.component_name),
            };
          },
        },

        getUpcomingMaintenance: {
          description: "Get upcoming and overdue maintenance items",
          inputSchema: zodSchema(
            z.object({
              overdueOnly: z.boolean().optional().describe("If true, return only overdue items"),
            })
          ),
          execute: async ({ overdueOnly = false }: { overdueOnly?: boolean }) => {
            const health = await getBoatHealth(boatId!);
            const filtered = health
              .filter((r) => {
                const s = (r.status ?? "").toLowerCase();
                if (overdueOnly) return s === "overdue";
                return s === "overdue" || s === "due soon";
              })
              .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
            return filtered.map((r) => ({
              component: r.component_name,
              system: r.system_name,
              status: r.status,
              monthsUntilDue: r.months_until_due,
              hoursUntilDue: r.hours_until_due,
              riskScore: r.risk_score,
            }));
          },
        },

        getInventoryStatus: {
          description: "Check spare parts inventory, especially low or missing items",
          inputSchema: zodSchema(
            z.object({
              lowStockOnly: z.boolean().optional(),
            })
          ),
          execute: async ({ lowStockOnly = false }: { lowStockOnly?: boolean }) => {
            const { data } = await supabase
              .from("inventory_items")
              .select("id, name, category, quantity, minimum_quantity, is_critical")
              .eq("boat_id", boatId)
              .order("name");

            type InvItem = {
              id: string;
              name: string;
              category: string;
              quantity: number;
              minimum_quantity: number;
              is_critical: boolean;
            };

            const items = (data ?? []) as InvItem[];
            const filtered = lowStockOnly
              ? items.filter((i) => i.quantity <= i.minimum_quantity)
              : items;

            return filtered.map((i) => ({
              id: i.id,
              name: i.name,
              category: i.category,
              quantity: i.quantity,
              minimum: i.minimum_quantity,
              status: i.quantity === 0 ? "missing" : i.quantity <= i.minimum_quantity ? "low" : "ok",
              isCritical: i.is_critical,
            }));
          },
        },

        draftTripLog: {
          description: "Parse a trip description into a structured draft for the user to review",
          inputSchema: zodSchema(
            z.object({
              description: z.string().describe("The trip description from the user"),
            })
          ),
          execute: async ({ description }: { description: string }) => {
            try {
              const draft = await generateTripDraftFromAI(description, {
                currentDate: new Date().toISOString().slice(0, 10),
                timezone: "UTC",
              });
              return { draft, boatId };
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await logChatError(supabase, { userId, boatId, message: `draftTripLog: ${msg}` });
              return { error: msg, boatId };
            }
          },
        },

        draftInventoryAdjustment: {
          description: "Find an inventory item and prepare a quantity reduction (consume) for the user to confirm",
          inputSchema: zodSchema(
            z.object({
              itemName: z.string().describe("Name of the item used or consumed"),
              quantityUsed: z.number().describe("How many were used (positive number)"),
              reason: z.string().describe("Why the item was used"),
            })
          ),
          execute: async ({
            itemName,
            quantityUsed,
            reason,
          }: {
            itemName: string;
            quantityUsed: number;
            reason: string;
          }) => {
            const isVague = !itemName || itemName.trim().length < 2;
            const { data: items } = isVague
              ? await supabase
                  .from("inventory_items")
                  .select("id, name, quantity, minimum_quantity, unit, category")
                  .eq("boat_id", boatId)
                  .order("name")
                  .limit(50)
              : await supabase
                  .from("inventory_items")
                  .select("id, name, quantity, minimum_quantity, unit, category")
                  .eq("boat_id", boatId)
                  .ilike("name", `%${itemName}%`)
                  .order("name")
                  .limit(5);

            return {
              searchTerm: itemName,
              matches: items ?? [],
              quantity: quantityUsed,
              transactionType: "consume",
              reason,
              boatId,
            };
          },
        },

        draftInventoryAdd: {
          description: "Find an inventory item and prepare a quantity increase (restock/purchase) for the user to confirm",
          inputSchema: zodSchema(
            z.object({
              itemName: z.string().describe("Name of the item purchased or restocked"),
              quantityAdded: z.number().describe("How many were bought or added (positive number)"),
              reason: z.string().describe("Context, e.g. 'Purchased at marine store'"),
            })
          ),
          execute: async ({
            itemName,
            quantityAdded,
            reason,
          }: {
            itemName: string;
            quantityAdded: number;
            reason: string;
          }) => {
            const { data: items } = await supabase
              .from("inventory_items")
              .select("id, name, quantity, minimum_quantity, unit, category")
              .eq("boat_id", boatId)
              .ilike("name", `%${itemName}%`)
              .limit(5);

            return {
              searchTerm: itemName,
              matches: items ?? [],
              quantity: quantityAdded,
              transactionType: "add",
              reason,
              boatId,
            };
          },
        },

        getTripHistory: {
          description: "Get recent trip logs for the boat",
          inputSchema: zodSchema(
            z.object({
              limit: z.number().optional().describe("Number of trips to return, default 10"),
            })
          ),
          execute: async ({ limit: n = 10 }: { limit?: number }) => {
            const { data } = await supabase
              .from("trips")
              .select("id, started_at, ended_at, engine_hours_delta, fuel_added_litres, notes")
              .eq("boat_id", boatId)
              .order("started_at", { ascending: false, nullsFirst: false })
              .limit(n);

            type TripRow = {
              id: string;
              started_at: string | null;
              ended_at: string | null;
              engine_hours_delta: number | null;
              fuel_added_litres: number | null;
              notes: string | null;
            };

            return ((data ?? []) as TripRow[]).map((t) => ({
              id: t.id,
              startedAt: t.started_at,
              endedAt: t.ended_at,
              engineHours: t.engine_hours_delta,
              fuelLitres: t.fuel_added_litres,
              notes: t.notes,
            }));
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const error = err as Error;
    await logChatError(supabase, {
      userId,
      boatId,
      message: error?.message ?? String(err),
      stack: error?.stack,
    });
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
