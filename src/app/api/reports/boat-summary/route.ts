import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";
import { getSelectedBoatId } from "@/lib/selected-boat";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const selectedId = await getSelectedBoatId();

  type BoatRow = { id: string; name: string; type: string | null; created_at: string };
  const { data: boats } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const boatList = (boats ?? []) as BoatRow[];
  if (boatList.length === 0) return new Response("No boats", { status: 404 });

  const boat: BoatRow = boatList.find((b) => b.id === selectedId) ?? boatList[0];

  const [health, inventoryRes, engineHoursRes, tripsRes] = await Promise.all([
    getBoatHealth(boat.id, supabase),
    supabase
      .from("inventory_items")
      .select("name,category,quantity,minimum_quantity,unit,is_critical,storage_location,manufacturer,sku,notes")
      .eq("boat_id", boat.id)
      .order("category,name"),
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
    supabase
      .from("trips")
      .select("started_at,ended_at,engine_hours_delta,fuel_added_litres,notes")
      .eq("boat_id", boat.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  return Response.json({
    generatedAt: new Date().toISOString(),
    boat: { name: boat.name, type: boat.type },
    engineHours: engineHoursRes.data ?? 0,
    health,
    inventory: inventoryRes.data ?? [],
    recentTrips: tripsRes.data ?? [],
  });
}
