import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { boatId, componentId, performedAt, workDone, notes, engineHoursAtService, cost, inventoryItemId, inventoryQuantityUsed } = body;

  if (!boatId || !componentId || !performedAt || !workDone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { error: insertError } = await supabase
    .from("maintenance_events")
    .insert({
      user_id: user.id,
      boat_id: boatId,
      component_id: componentId,
      performed_at: performedAt,
      work_done: workDone,
      notes: notes ?? null,
      engine_hours_at_service: engineHoursAtService ?? null,
      cost: cost != null ? Number(cost) : null,
    });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("components")
    .update({
      last_serviced_at: performedAt,
      ...(engineHoursAtService != null ? { last_serviced_hours: engineHoursAtService } : {}),
    })
    .eq("id", componentId)
    .eq("boat_id", boatId);

  if (inventoryItemId && inventoryQuantityUsed > 0) {
    await supabase.rpc("adjust_inventory_stock", {
      p_inventory_item_id: inventoryItemId,
      p_transaction_type: "consume",
      p_quantity_delta: inventoryQuantityUsed,
      p_notes: `Used during maintenance: ${workDone}`,
    });
  }

  return Response.json({ ok: true });
}
