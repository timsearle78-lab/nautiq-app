import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const body = await req.json();
  const { boatId, started_at, ended_at, engine_hours_delta, fuel_added_litres, notes, source, raw_input,
          start_latitude, start_longitude, end_latitude, end_longitude } = body;

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
    start_latitude: start_latitude ?? null,
    start_longitude: start_longitude ?? null,
    end_latitude: end_latitude ?? null,
    end_longitude: end_longitude ?? null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // If fuel was recorded, consume it from the first matching inventory item
  // (any item whose name contains "fuel", "diesel", or "petrol").
  if (fuel_added_litres && Number(fuel_added_litres) > 0) {
    const { data: fuelItems } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("boat_id", boatId)
      .or("name.ilike.%fuel%,name.ilike.%diesel%,name.ilike.%petrol%,name.ilike.%gasoline%")
      .order("name")
      .limit(1);

    const fuelItemId = fuelItems?.[0]?.id;
    if (fuelItemId) {
      await supabase.rpc("adjust_inventory_stock", {
        p_inventory_item_id: fuelItemId,
        p_transaction_type: "consume",
        p_quantity_delta: Number(fuel_added_litres),
        p_notes: `Auto-deducted from trip on ${new Date().toLocaleDateString()}`,
      });
      revalidatePath("/inventory");
    }
  }

  revalidatePath("/chat");
  revalidatePath("/maintenance");

  return Response.json({ ok: true });
}
