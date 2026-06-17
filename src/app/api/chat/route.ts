import { streamText, zodSchema, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";

export async function POST(req: Request) {
  const { messages, boatId } = await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

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
    model: openai("gpt-4o"),
    system: `You are NautIQ, a practical boat assistant for "${boat.name}".
Engine hours: ${engineHours ?? 0}h.

Your job:
1. When the owner describes a trip, call draftTripLog immediately.
2. When the owner mentions using a spare part, call draftInventoryAdjustment.
3. For maintenance questions, call getUpcomingMaintenance.
4. For inventory/spares questions, call getInventoryStatus.
5. For general boat health, call getBoatSummary.

Keep responses short and practical. After calling draftTripLog or draftInventoryAdjustment, tell the owner the draft is ready to review.`,
    messages: modelMessages,
    tools: {
      getBoatSummary: {
        description: "Get boat health score, engine hours, and most urgent maintenance",
        inputSchema: zodSchema(z.object({})),
        execute: async () => {
          const [healthRes, hoursRes, timelineRes] = await Promise.all([
            supabase.rpc("get_boat_health", { p_boat_id: boatId }),
            supabase.rpc("get_boat_engine_hours", { p_boat_id: boatId }),
            supabase.rpc("get_boat_maintenance_timeline", {
              p_boat_id: boatId,
              p_horizon_days: 90,
            }),
          ]);

          const components = (healthRes.data ?? []) as { risk_score?: number }[];
          const avgRisk =
            components.length > 0
              ? components.reduce((s, c) => s + (c.risk_score ?? 0), 0) / components.length
              : 0;
          const healthScore = Math.max(0, Math.round(100 - avgRisk));
          const timeline = (timelineRes.data ?? []) as { status: string; component_name: string }[];

          return {
            boatName: boat.name,
            engineHours: hoursRes.data ?? 0,
            healthScore,
            overdueCount: timeline.filter((t) => t.status === "overdue").length,
            dueSoonCount: timeline.filter((t) => t.status === "due_soon").length,
            urgentItems: timeline
              .filter((t) => t.status === "overdue")
              .slice(0, 3)
              .map((t) => t.component_name),
          };
        },
      },

      getUpcomingMaintenance: {
        description: "Get upcoming and overdue maintenance items",
        inputSchema: zodSchema(
          z.object({
            horizonDays: z.number().optional().describe("Days to look ahead, default 90"),
          })
        ),
        execute: async ({ horizonDays = 90 }: { horizonDays?: number }) => {
          const { data } = await supabase.rpc("get_boat_maintenance_timeline", {
            p_boat_id: boatId,
            p_horizon_days: horizonDays,
          });

          type TimelineRow = {
            component_name: string;
            system_name: string;
            status: string;
            predicted_due_date: string;
            explanation: string;
          };

          return ((data ?? []) as TimelineRow[]).slice(0, 8).map((t) => ({
            component: t.component_name,
            system: t.system_name,
            status: t.status,
            dueDate: t.predicted_due_date,
            explanation: t.explanation,
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
          const draft = await generateTripDraftFromAI(description, {
            currentDate: new Date().toISOString().slice(0, 10),
            timezone: "UTC",
          });
          return { draft, boatId };
        },
      },

      draftInventoryAdjustment: {
        description: "Find an inventory item and prepare a quantity reduction for the user to confirm",
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
          const { data: items } = await supabase
            .from("inventory_items")
            .select("id, name, quantity, minimum_quantity, unit, category")
            .eq("boat_id", boatId)
            .ilike("name", `%${itemName}%`)
            .limit(5);

          return {
            searchTerm: itemName,
            matches: items ?? [],
            quantityUsed,
            reason,
            boatId,
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
