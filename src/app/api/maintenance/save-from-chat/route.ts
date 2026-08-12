import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { boatId, componentId, performedAt, workDone, notes, engineHoursAtService, inventoryItemId, inventoryQuantityUsed } = body;

  if (!boatId || !componentId || !performedAt || !workDone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify boat ownership
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
    });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // Update component's last_serviced_at
  await supabase
    .from("components")
    .update({
      last_serviced_at: performedAt,
      ...(engineHoursAtService != null ? { last_serviced_hours: engineHoursAtService } : {}),
    })
    .eq("id", componentId)
    .eq("boat_id", boatId);

  // Optionally consume an inventory item
  if (inventoryItemId && inventoryQuantityUsed > 0) {
    const { data: invItem } = await supabase
      .from("inventory_items")
      .select("id, quantity")
      .eq("id", inventoryItemId)
      .single();
    if (invItem) {
      const newQty = Math.max(0, invItem.quantity - inventoryQuantityUsed);
      await Promise.all([
        supabase.from("inventory_items").update({ quantity: newQty }).eq("id", inventoryItemId),
        supabase.from("inventory_transactions").insert({
          inventory_item_id: inventoryItemId,
          transaction_type: "consume",
          quantity_delta: -inventoryQuantityUsed,
          notes: `Used during maintenance: ${workDone}`,
          user_id: user.id,
          boat_id: boatId,
        }),
      ]);
    }
  }

  return Response.json({ ok: true });
}
