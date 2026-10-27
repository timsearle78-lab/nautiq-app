import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get("boatId");
  if (!boatId) return Response.json({ error: "boatId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("trips")
    .select("engine_hours_delta")
    .eq("boat_id", boatId)
    .not("engine_hours_delta", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const total = (data ?? []).reduce((sum, row) => sum + (Number(row.engine_hours_delta) || 0), 0);
  return Response.json({ total: Math.round(total * 10) / 10 });
}
