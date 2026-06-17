import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { itemId, quantity, transactionType = "consume", reason } = await req.json();

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
  const newQuantity =
    transactionType === "add"
      ? item.quantity + delta
      : Math.max(0, item.quantity - delta);

  const [updateRes, txRes] = await Promise.all([
    supabase.from("inventory_items").update({ quantity: newQuantity }).eq("id", itemId),
    supabase.from("inventory_transactions").insert({
      inventory_item_id: itemId,
      transaction_type: transactionType === "add" ? "added" : "consumed",
      quantity_delta: transactionType === "add" ? delta : -delta,
      notes: reason ?? (transactionType === "add" ? "Restocked" : "Used"),
      user_id: user.id,
      boat_id: item.boat_id,
    }),
  ]);

  if (updateRes.error) return Response.json({ error: updateRes.error.message }, { status: 500 });
  if (txRes.error) return Response.json({ error: txRes.error.message }, { status: 500 });

  return Response.json({ ok: true, newQuantity, itemName: item.name });
}
