import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get("boatId");
  if (!boatId) return Response.json({ error: "boatId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [tripsRes, boatRes] = await Promise.all([
    supabase
      .from("trips")
      .select("engine_hours_delta")
      .eq("boat_id", boatId)
      .not("engine_hours_delta", "is", null),
    supabase
      .from("boats")
      .select("engine_hours_initial")
      .eq("id", boatId)
      .single(),
  ]);

  const tripTotal = (tripsRes.data ?? []).reduce((sum, row) => sum + (Number(row.engine_hours_delta) || 0), 0);
  const initialSet = boatRes.data?.engine_hours_initial != null;
  const initial = Number(boatRes.data?.engine_hours_initial) || 0;
  const total = Math.round((initial + tripTotal) * 10) / 10;
  return Response.json({ total, initial, initialSet });
}
