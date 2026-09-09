import { streamText, generateText, zodSchema, convertToModelMessages, stepCountIs } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";
import { getBoatHealth } from "@/lib/components/health";
import { HELP_SYSTEM_PROMPT } from "@/lib/help-content";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

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
  // 30 messages per IP per 10 minutes
  if (!rateLimit(`chat:${getClientIp(req)}`, 30, 10 * 60 * 1000)) {
    return tooManyRequests();
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured on the server." }, { status: 500 });
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
      .select("id, name, type, propulsion, hull_design, hull_material, length_m, beam_m, draft_m, description")
      .eq("id", boatId)
      .eq("user_id", user.id)
      .single();
    if (!boat) return new Response("Boat not found", { status: 404 });

    const boatSpec = [
      boat.type,
      boat.propulsion,
      boat.hull_design,
      boat.hull_material,
      boat.length_m ? `${boat.length_m}m LOA` : null,
      boat.beam_m ? `${boat.beam_m}m beam` : null,
      boat.draft_m ? `${boat.draft_m}m draft` : null,
    ].filter(Boolean).join(", ");

    const { data: engineHours } = await supabase.rpc("get_boat_engine_hours", {
      p_boat_id: boatId,
    });

    const modelMessages = await convertToModelMessages(messages);

    function isRateLimit(err: unknown): boolean {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      return msg.includes("rate limit") || msg.includes("rate_limit") || msg.includes("429") ||
        msg.includes("quota") || msg.includes("daily") || msg.includes("tokens per");
    }

    let result;
    try {
      result = streamText({
      model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-haiku-4-5-20251001"),
      stopWhen: stepCountIs(1),
      system: `You are the owner's personal boat assistant (PBA) for their boat "${boat.name}". Always maintain a warm, knowledgeable, and encouraging persona — you care about this boat as much as the owner does.
Today's date: ${new Date().toISOString().slice(0, 10)}.
${boatSpec ? `Boat specs: ${boatSpec}.` : ""}${(boat as { description?: string | null }).description ? `\nOwner's description: ${(boat as { description?: string | null }).description}` : ""}
Engine hours: ${engineHours ?? 0}h.

SCOPE: You only help with topics directly related to this boat — maintenance, trips, inventory, health score, spare parts, engine hours, and how to use the NautIQ app. If the user asks about anything else (general knowledge, cooking, coding, news, other topics, etc.), respond with exactly: "Sorry, I can only help with questions about your boat and the NautIQ app." Do not elaborate or apologise further.

${HELP_SYSTEM_PROMPT}

When the user asks a "how do I" or "how does X work" question about the app, answer it directly in plain conversational text without calling any tool. Keep answers concise and friendly.

TOOL SELECTION RULES — follow these exactly (only for data/action requests, not how-to questions):

1. LOGGING MAINTENANCE: If the owner says they did, performed, completed, or finished any maintenance or service work — including oil changes, filter replacements, antifouling, engine service, inspections, winterising, etc. (e.g. "I did an oil change", "changed the impeller", "serviced the engine", "replaced the bilge pump") → call draftMaintenanceLog immediately.

2. LOGGING A TRIP: If the owner is telling you about a trip they just did (e.g. "went sailing", "motored for 2 hours", "left marina at 10am", "went racing") → call draftTripLog immediately. Do NOT call getTripHistory.

3. USING A PART: If the owner mentions using/consuming a spare part or says something like "used a part", "used a spare", "I used something" (even without naming it) → call draftInventoryAdjustment. If no specific item is named, pass itemName as an empty string so the user can pick from their full inventory.

4. ADDING/BUYING A PART: If the owner wants to add a new item to inventory, restock, buy, or purchase parts (e.g. "add 5m of rope", "I bought a new filter", "add dyneema rope to inventory") → call draftInventoryAdd.

5. UPCOMING MAINTENANCE: "what do I need to do", "what's due", "what maintenance is coming up" → call getUpcomingMaintenance.

6. PAST MAINTENANCE: If the owner asks what maintenance they HAVE DONE, recently completed, or their maintenance history (e.g. "what maintenance have I done", "show maintenance history", "what have I serviced", "what did I fix") → call getMaintenanceHistory. Do NOT call getTripHistory for these.

7. INVENTORY QUESTIONS: "show my inventory", "what spares do I have" → call getInventoryStatus.

8. BOAT HEALTH: General health questions → call getBoatSummary.

9. REPORT / PDF: If the user asks for a report, summary PDF, or to send/download a boat report → call requestBoatReport.

10. VIEWING PAST TRIPS: Only call getTripHistory if the owner explicitly asks to SEE or SHOW their trips (e.g. "show my trips", "what trips have I done", "trip history").

11. PERSONALISED UPDATE / BRIEFING: If the owner asks for an update, status check, "how's my boat doing", "give me a summary", "what's happening", "help me with my boat", or any general check-in → call getPersonalizedGreeting.

The UI renders tool results as formatted cards automatically — do NOT add any text after calling any tool. The card is the response.`,
      messages: modelMessages,
      onError: async (event) => {
        const err = event.error as Error | undefined;
        if (isRateLimit(err)) return;
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
            try {
              const [health, hoursRes] = await Promise.all([
                getBoatHealth(boatId!, supabase),
                supabase.rpc("get_boat_engine_hours", { p_boat_id: boatId }),
              ]);
              const knownHealth = health.filter((c) => c.risk_score != null);
              const avgRisk =
                knownHealth.length > 0
                  ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
                  : 0;
              const healthScore = Math.max(0, Math.round(100 - avgRisk));
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
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await logChatError(supabase, { userId, boatId, message: `getBoatSummary: ${msg}` });
              throw err;
            }
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
            try {
              const health = await getBoatHealth(boatId!, supabase);
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
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await logChatError(supabase, { userId, boatId, message: `getUpcomingMaintenance: ${msg}` });
              throw err;
            }
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
              minimum_quantity: i.minimum_quantity,
              status: i.quantity === 0 ? "missing" : i.quantity <= i.minimum_quantity ? "low" : "ok",
              isCritical: i.is_critical,
            }));
          },
        },

        draftMaintenanceLog: {
          description: "Parse a maintenance description into a structured draft for the user to review and save",
          inputSchema: zodSchema(
            z.object({
              componentName: z.string().describe("The component or system the work was done on, e.g. 'Engine', 'Oil filter', 'Bilge pump'"),
              workDone: z.string().describe("A concise description of the work performed, e.g. 'Changed engine oil and filter'"),
              performedAt: z.string().describe("Date of service in YYYY-MM-DD format, default to today if not stated"),
              notes: z.string().optional().describe("Any additional notes, e.g. product used, findings, next steps"),
              engineHoursAtService: z.number().optional().describe("Engine hours at time of service if mentioned"),
            })
          ),
          execute: async ({
            componentName,
            workDone,
            performedAt,
            notes,
            engineHoursAtService,
          }: {
            componentName: string;
            workDone: string;
            performedAt: string;
            notes?: string;
            engineHoursAtService?: number;
          }) => {
            try {
              const [{ data: components }, { data: inventoryItems }] = await Promise.all([
                supabase
                  .from("components")
                  .select("id, name, system:systems(name)")
                  .eq("boat_id", boatId)
                  .order("name"),
                supabase
                  .from("inventory_items")
                  .select("id, name, quantity, unit")
                  .eq("boat_id", boatId)
                  .gt("quantity", 0)
                  .order("name"),
              ]);

              type CompRow = { id: string; name: string; system: { name: string } | { name: string }[] | null };
              const mapped = ((components ?? []) as CompRow[]).map((c) => {
                const sys = Array.isArray(c.system) ? c.system[0] : c.system;
                return { id: c.id, name: c.name, system_name: sys?.name ?? null };
              });

              return {
                componentName,
                workDone,
                performedAt,
                notes: notes ?? null,
                engineHoursAtService: engineHoursAtService ?? null,
                components: mapped,
                inventoryItems: (inventoryItems ?? []) as { id: string; name: string; quantity: number; unit: string | null }[],
                boatId,
              };
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await logChatError(supabase, { userId, boatId, message: `draftMaintenanceLog: ${msg}` });
              return { error: msg, boatId };
            }
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

        getMaintenanceHistory: {
          description: "Get recent maintenance records — what work has been done on the boat",
          inputSchema: zodSchema(
            z.object({
              limit: z.number().optional().describe("Number of records to return, default 10"),
            })
          ),
          execute: async ({ limit: n = 10 }: { limit?: number }) => {
            const { data } = await supabase
              .from("maintenance_events")
              .select("id, performed_at, work_done, vendor, engine_hours_at_service, notes, component:components(name)")
              .eq("boat_id", boatId)
              .order("performed_at", { ascending: false, nullsFirst: false })
              .limit(n);

            type EventRow = {
              id: string;
              performed_at: string | null;
              work_done: string | null;
              vendor: string | null;
              engine_hours_at_service: number | null;
              notes: string | null;
              component: { name: string }[] | null;
            };

            return ((data ?? []) as EventRow[]).map((e) => ({
              id: e.id,
              performedAt: e.performed_at,
              workDone: e.work_done,
              component: Array.isArray(e.component) ? e.component[0]?.name ?? null : (e.component as { name: string } | null)?.name ?? null,
              vendor: e.vendor,
              engineHours: e.engine_hours_at_service,
              notes: e.notes,
            }));
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

        getPersonalizedGreeting: {
          description: "Generate a personalised briefing for the owner — recent activity, health status, encouragement, and reminders",
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            try {
              const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
              const [health, tripsRes, maintenanceRes, lastTripRes] = await Promise.all([
                getBoatHealth(boatId!, supabase),
                supabase
                  .from("trips")
                  .select("started_at, engine_hours_delta, fuel_added_litres, notes")
                  .eq("boat_id", boatId)
                  .gte("started_at", thirtyDaysAgo)
                  .order("started_at", { ascending: false })
                  .limit(5),
                supabase
                  .from("maintenance_events")
                  .select("performed_at, work_done")
                  .eq("boat_id", boatId)
                  .gte("performed_at", thirtyDaysAgo)
                  .order("performed_at", { ascending: false })
                  .limit(5),
                supabase
                  .from("trips")
                  .select("started_at")
                  .eq("boat_id", boatId)
                  .order("started_at", { ascending: false })
                  .limit(1),
              ]);

              const knownHealth = health.filter((c) => c.risk_score != null);
              const avgRisk =
                knownHealth.length > 0
                  ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
                  : 0;
              const healthScore = Math.max(0, Math.round(100 - avgRisk));
              const overdueCount = health.filter((c) => c.status === "overdue").length;
              const dueSoonCount = health.filter((c) => c.status === "due soon").length;

              const recentTrips = tripsRes.data ?? [];
              const recentMaintenance = maintenanceRes.data ?? [];
              const lastTrip = lastTripRes.data?.[0];
              const daysSinceTrip = lastTrip?.started_at
                ? Math.floor((Date.now() - new Date(lastTrip.started_at).getTime()) / (1000 * 60 * 60 * 24))
                : null;

              const hour = new Date().getUTCHours();
              const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

              const context = [
                `Health score: ${healthScore}/100`,
                `Overdue items: ${overdueCount}`,
                `Due soon: ${dueSoonCount}`,
                `Trips in last 30 days: ${recentTrips.length}`,
                daysSinceTrip !== null
                  ? `Last trip: ${daysSinceTrip} day${daysSinceTrip !== 1 ? "s" : ""} ago`
                  : "No trips recorded yet",
                recentMaintenance.length > 0
                  ? `Maintenance in last 30 days: ${recentMaintenance.map((m) => m.work_done).filter(Boolean).join(", ")}`
                  : "No maintenance logged in the last 30 days",
              ].join("\n");

              const { text: greetingText } = await generateText({
                model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })("claude-haiku-4-5-20251001"),
                maxOutputTokens: 220,
                prompt: `You are the personal boat assistant (PBA) for the owner of "${boat.name}". Write a warm, personalised update for the owner who asked how their boat is doing. It is ${timeOfDay} and today's date is ${new Date().toISOString().slice(0, 10)}.

Boat context:
${context}

Instructions:
- Be warm, conversational, and encouraging
- Summarise the current health and recent activity (2-3 sentences)
- If health score >= 80 and maintenance done recently: praise their dedication
- If health score < 60 or overdue count > 0: gently encourage them to tackle something specific
- If they haven't been out in 14+ days or have no trips: encourage them to get the boat out
- Mention logging diesel top-ups or trips if relevant
- Keep it to 3-5 sentences. Plain text — no markdown, no bullet points.
- Never mention the owner's name. Refer to the boat by name.`,
              });

              return { greetingText };
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              await logChatError(supabase, { userId, boatId, message: `getPersonalizedGreeting: ${msg}` });
              return { greetingText: "Here's a quick status check — check the health dashboard for details on any overdue items." };
            }
          },
        },

        requestBoatReport: {
          description: "Generate and download a PDF summary of the boat, including maintenance schedule and inventory",
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            return { ready: true, boatName: boat.name };
          },
        },
      },
    });
    } catch (modelErr) {
      if (isRateLimit(modelErr)) {
        return Response.json(
          { error: "RATE_LIMIT" },
          { status: 429 }
        );
      }
      throw modelErr;
    }

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
