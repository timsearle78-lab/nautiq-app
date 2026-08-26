import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { boatId, localHour } = await req.json();

  const { data: boat } = await supabase
    .from("boats")
    .select("id, name")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return new Response("Not found", { status: 404 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [health, tripsRes, maintenanceRes, engineHoursRes, lastTripRes, inventoryRes, overdueComponentsRes] = await Promise.all([
    getBoatHealth(boatId),
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
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boatId }),
    supabase
      .from("trips")
      .select("started_at")
      .eq("boat_id", boatId)
      .order("started_at", { ascending: false })
      .limit(1),
    supabase
      .from("inventory_items")
      .select("name, quantity, minimum_quantity, is_critical, expiry_date")
      .eq("boat_id", boatId),
    supabase
      .from("component_health")
      .select("component_name, status, predicted_due_date")
      .eq("boat_id", boatId)
      .in("status", ["overdue", "due soon"])
      .order("status", { ascending: true })
      .limit(5),
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

  // Build actionable inventory alerts
  type InvRow = { name: string; quantity: number; minimum_quantity: number | null; is_critical: boolean; expiry_date: string | null };
  const invItems = (inventoryRes.data ?? []) as InvRow[];
  const missingCritical = invItems.filter((i) => i.is_critical && Number(i.quantity) <= 0).map((i) => i.name);
  const lowCritical = invItems.filter((i) => i.is_critical && Number(i.quantity) > 0 && i.minimum_quantity != null && Number(i.quantity) < Number(i.minimum_quantity)).map((i) => i.name);
  const expiringSoon = invItems.filter((i) => i.expiry_date && i.expiry_date <= in90Days && i.expiry_date >= today).map((i) => i.name);

  type CompRow = { component_name: string; status: string; predicted_due_date: string | null };
  const atRiskComponents = (overdueComponentsRes.data ?? []) as CompRow[];

  const hour = typeof localHour === "number" ? localHour : new Date().getUTCHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const alerts: string[] = [];
  if (missingCritical.length > 0) alerts.push(`CRITICAL MISSING spares: ${missingCritical.join(", ")} — must be sourced before next sail`);
  if (lowCritical.length > 0) alerts.push(`Low critical stock: ${lowCritical.join(", ")}`);
  if (expiringSoon.length > 0) alerts.push(`Expiring within 90 days: ${expiringSoon.join(", ")}`);
  if (atRiskComponents.length > 0) alerts.push(`Maintenance ${atRiskComponents.map((c) => `${c.component_name} (${c.status})`).join(", ")}`);

  const context = [
    `Health score: ${healthScore}/100`,
    `Engine hours: ${engineHoursRes.data ?? 0}h`,
    `Trips in last 30 days: ${recentTrips.length}`,
    daysSinceTrip !== null
      ? `Last trip: ${daysSinceTrip} day${daysSinceTrip !== 1 ? "s" : ""} ago`
      : "No trips recorded yet",
    recentMaintenance.length > 0
      ? `Recent maintenance: ${recentMaintenance.map((m) => m.work_done).filter(Boolean).join(", ")}`
      : "No maintenance logged in the last 30 days",
    alerts.length > 0 ? `\nACTIONABLE ISSUES (prioritise these):\n${alerts.map((a) => `- ${a}`).join("\n")}` : "No critical issues.",
  ].join("\n");

  const { text } = await generateText({
    model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-haiku-4-5-20251001"),
    maxOutputTokens: 100,
    prompt: `You are the personal boat assistant for "${boat.name}". Write a short, practical update (2–3 sentences max) for the owner opening NautIQ. It is ${timeOfDay}.

Boat context:
${context}

Instructions:
- Lead with the most important actionable issue if one exists (missing spares, overdue service, expiring items). Name it specifically.
- If there are no issues, give brief positive context and one tip or nudge (e.g. suggest a sail, remind about upcoming service).
- Plain text only — no markdown, no bullet points, no lists.
- Friendly and direct, like a knowledgeable marina friend. Do not be sycophantic.`,
  });

  return Response.json({
    greeting: text,
    healthScore,
    overdueCount,
    dueSoonCount,
    engineHours: engineHoursRes.data ?? 0,
    tripCount: recentTrips.length,
    daysSinceTrip,
  });
}
