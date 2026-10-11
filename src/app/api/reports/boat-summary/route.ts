import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

export async function GET(req: Request) {
  // 10 report downloads per IP per 10 minutes
  if (!rateLimit(`report:${getClientIp(req)}`, 10, 10 * 60 * 1000)) {
    return tooManyRequests();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const selectedId = await getSelectedBoatId();

  type BoatRow = { id: string; name: string; type: string | null; created_at: string; fuel_tank_litres: number | null };
  const { data: boats } = await supabase
    .from("boats")
    .select("id,name,type,created_at,fuel_tank_litres")
    .order("created_at", { ascending: true });

  const boatList = (boats ?? []) as BoatRow[];
  if (boatList.length === 0) return new Response("No boats", { status: 404 });

  const boat: BoatRow = boatList.find((b) => b.id === selectedId) ?? boatList[0];

  const [health, inventoryRes, engineHoursRes, tripsRes, maintenanceRes, fuelItemRes] = await Promise.all([
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
    supabase
      .from("maintenance_events")
      .select("performed_at,work_done,vendor,engine_hours_at_service,notes,components(name)")
      .eq("boat_id", boat.id)
      .order("performed_at", { ascending: false })
      .limit(50),
    supabase
      .from("inventory_items")
      .select("quantity")
      .eq("boat_id", boat.id)
      .or("name.ilike.%fuel%,name.ilike.%diesel%,name.ilike.%petrol%,name.ilike.%gasoline%")
      .order("name")
      .limit(1)
      .maybeSingle(),
  ]);

  const fuelTankLitres = boat.fuel_tank_litres ?? null;
  const fuelCurrentLitres = fuelItemRes.data ? Number(fuelItemRes.data.quantity) : null;
  const fuelPct = fuelTankLitres && fuelTankLitres > 0 && fuelCurrentLitres != null
    ? Math.min(1, Math.max(0, fuelCurrentLitres / fuelTankLitres))
    : null;

  return Response.json({
    generatedAt: new Date().toISOString(),
    boat: { name: boat.name, type: boat.type, fuelTankLitres, fuelCurrentLitres, fuelPct },
    engineHours: engineHoursRes.data ?? 0,
    health: health.components,
    inventory: inventoryRes.data ?? [],
    recentTrips: tripsRes.data ?? [],
    maintenanceHistory: maintenanceRes.data ?? [],
  });
}
