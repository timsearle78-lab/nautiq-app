import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { BOAT_COOKIE } from "@/lib/selected-boat";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { name, type, propulsion, hull_design, hull_material, length_m, beam_m, draft_m, description } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Boat name required" }, { status: 400 });

  const { data: boat, error: boatError } = await supabase
    .from("boats")
    .insert({ user_id: user.id, name: name.trim(), type: type || "Motorboat", propulsion: propulsion || null, hull_design: hull_design || null, hull_material: hull_material || null, length_m: length_m || null, beam_m: beam_m || null, draft_m: draft_m || null, description: description || null })
    .select("id, name, type")
    .single();

  if (boatError) return Response.json({ error: boatError.message }, { status: 500 });

  await supabase.rpc("seed_boat_templates", { p_boat_id: boat.id });

  const [systemsRes, componentsRes] = await Promise.all([
    supabase.from("systems").select("id, name").eq("boat_id", boat.id).order("name"),
    supabase
      .from("components")
      .select("id, name, system_id, service_interval_months, service_interval_engine_hours")
      .eq("boat_id", boat.id)
      .order("name"),
  ]);

  // Set selected boat cookie
  const cookieStore = await cookies();
  cookieStore.set(BOAT_COOKIE, boat.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  return Response.json({
    boatId: boat.id,
    boatName: boat.name,
    systems: systemsRes.data ?? [],
    components: componentsRes.data ?? [],
  });
}
