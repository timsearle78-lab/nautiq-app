import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { itemId, quantity, transactionType = "consume", reason, cost } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, boat_id, quantity, name")
    .eq("id", itemId)
    .single();

  if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", item.boat_id)
    .eq("user_id", user.id)
    .single();

  if (!boat) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const delta = Number(quantity) || 1;

  let newQuantity: number;
  let quantityDelta: number;
  if (transactionType === "add") {
    newQuantity = item.quantity + delta;
    quantityDelta = delta;
  } else if (transactionType === "correct") {
    newQuantity = Math.max(0, delta);
    quantityDelta = newQuantity - item.quantity;
  } else {
    newQuantity = Math.max(0, item.quantity - delta);
    quantityDelta = -(item.quantity - newQuantity);
  }

  const [updateRes, txRes] = await Promise.all([
    supabase.from("inventory_items").update({ quantity: newQuantity }).eq("id", itemId),
    supabase.from("inventory_transactions").insert({
      inventory_item_id: itemId,
      transaction_type: transactionType,
      quantity_delta: quantityDelta,
      notes: reason ?? (transactionType === "add" ? "Restocked" : transactionType === "correct" ? "Stock correction" : "Used"),
      cost: transactionType === "add" && cost != null ? Number(cost) : null,
      user_id: user.id,
      boat_id: item.boat_id,
    }),
  ]);

  if (updateRes.error) return Response.json({ error: updateRes.error.message }, { status: 500 });
  if (txRes.error) return Response.json({ error: txRes.error.message }, { status: 500 });

  return Response.json({ ok: true, newQuantity, itemName: item.name });
}
