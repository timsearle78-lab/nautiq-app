import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get("boatId");
  if (!boatId) return new Response("boatId required", { status: 400 });

  const [componentsRes, inventoryRes] = await Promise.all([
    supabase.from("components").select("id, name").eq("boat_id", boatId).order("name"),
    supabase.from("inventory_items").select("id, name, quantity, unit").eq("boat_id", boatId).order("name"),
  ]);

  return Response.json({
    components: componentsRes.data ?? [],
    inventory: inventoryRes.data ?? [],
  });
}
