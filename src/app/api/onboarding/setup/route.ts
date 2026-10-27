import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const {
    boatId,
    // Fuel
    fuel_tank_litres,
    fuel_consumption_lph,
    engine_hours,
    // Notifications
    health_summary,
    overdue_alerts,
  } = await req.json();

  const errors: string[] = [];

  // Update boat fuel settings + initial engine hours
  if (boatId) {
    const boatUpdate: Record<string, unknown> = {};
    if (fuel_tank_litres != null) boatUpdate.fuel_tank_litres = fuel_tank_litres;
    if (fuel_consumption_lph != null) boatUpdate.fuel_consumption_lph = fuel_consumption_lph;
    if (engine_hours != null) boatUpdate.engine_hours_initial = engine_hours;
    if (Object.keys(boatUpdate).length > 0) {
      const { error } = await supabase.from("boats").update(boatUpdate).eq("id", boatId).eq("user_id", user.id);
      if (error) errors.push(error.message);
    }
  }

  // Upsert notification preferences
  if (health_summary !== undefined || overdue_alerts !== undefined) {
    const { data: existing } = await supabase
      .from("user_notification_prefs")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const prefs: Record<string, unknown> = { user_id: user.id };
    if (health_summary !== undefined) prefs.health_summary = health_summary;
    if (overdue_alerts !== undefined) prefs.overdue_alerts = overdue_alerts;

    if (existing) {
      const { error } = await supabase.from("user_notification_prefs").update(prefs).eq("user_id", user.id);
      if (error) errors.push(error.message);
    } else {
      const { error } = await supabase.from("user_notification_prefs").insert({ ...prefs, health_summary_day: 1, email_unsubscribed: false });
      if (error) errors.push(error.message);
    }
  }

  if (errors.length > 0) return Response.json({ error: errors.join("; ") }, { status: 500 });
  return Response.json({ ok: true });
}
