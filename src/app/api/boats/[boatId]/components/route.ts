import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boatId: string }> }
) {
  const { boatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { data } = await supabase
    .from("components")
    .select("id, name, system:systems(name)")
    .eq("boat_id", boatId)
    .order("name");

  type Row = { id: string; name: string; system: { name: string } | { name: string }[] | null };
  const rows = ((data ?? []) as Row[]).map((c) => {
    const sys = Array.isArray(c.system) ? c.system[0] : c.system;
    return { id: c.id, name: c.name, system_name: sys?.name ?? null };
  });

  return Response.json(rows);
}
