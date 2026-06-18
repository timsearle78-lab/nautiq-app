import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const body = await req.json();
  const { boatId, started_at, ended_at, engine_hours_delta, fuel_added_litres, notes, source, raw_input } = body;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!boatId || engine_hours_delta == null) {
    return Response.json({ error: "boatId and engine_hours_delta are required" }, { status: 400 });
  }

  const { error } = await supabase.from("trips").insert({
    boat_id: boatId,
    user_id: user.id,
    started_at: started_at ?? new Date().toISOString(),
    ended_at: ended_at ?? null,
    engine_hours_delta: Number(engine_hours_delta),
    fuel_added_litres: fuel_added_litres ?? null,
    notes: notes ?? null,
    source: source ?? "ai_quick_log",
    raw_input: raw_input ?? null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidatePath("/chat");
  revalidatePath("/maintenance");

  return Response.json({ ok: true });
}
