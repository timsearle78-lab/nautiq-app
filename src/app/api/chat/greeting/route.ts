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

  const [health, tripsRes, maintenanceRes, engineHoursRes, lastTripRes] = await Promise.all([
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

  const hour = typeof localHour === "number" ? localHour : new Date().getUTCHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const context = [
    `Health score: ${healthScore}/100`,
    `Overdue items: ${overdueCount}`,
    `Due soon: ${dueSoonCount}`,
    `Engine hours: ${engineHoursRes.data ?? 0}h`,
    `Trips in last 30 days: ${recentTrips.length}`,
    daysSinceTrip !== null
      ? `Last trip: ${daysSinceTrip} day${daysSinceTrip !== 1 ? "s" : ""} ago`
      : "No trips recorded yet",
    recentMaintenance.length > 0
      ? `Maintenance in last 30 days: ${recentMaintenance.map((m) => m.work_done).filter(Boolean).join(", ")}`
      : "No maintenance logged in the last 30 days",
  ].join("\n");

  const { text } = await generateText({
    model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-haiku-4-5-20251001"),
    maxOutputTokens: 220,
    prompt: `You are the owner's personal boat assistant (PBA) for their boat "${boat.name}". Write a warm, personalised greeting for the owner who just opened their NautIQ app. It is ${timeOfDay} and today's date is ${new Date().toISOString().slice(0, 10)}.

Boat context:
${context}

Instructions:
- Open with "Good ${timeOfDay}!"
- Give a brief, friendly status summary (2-3 sentences)
- If health score >= 80 and they've logged maintenance recently: praise their dedication
- If health score < 60 or overdue count > 0: gently encourage them to tackle something
- If they haven't been out in 14+ days or have no trips recorded: encourage them to get the boat out
- Casually mention logging diesel top-ups or trips if relevant
- Keep it to 3-5 sentences. Warm, practical, encouraging. Plain text — no markdown, no bullet points.
- Never mention the owner's name (we don't have it). Refer to the boat by name.`,
  });

  return Response.json({ greeting: text });
}
