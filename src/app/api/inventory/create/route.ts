import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { boatId, name, category, unit, quantity } = await req.json();

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

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      user_id: user.id,
      boat_id: boatId,
      name: String(name ?? "").trim(),
      category: String(category ?? "General").trim() || "General",
      unit: String(unit ?? "").trim() || null,
      quantity: Number(quantity) || 0,
      minimum_quantity: 0,
      is_critical: false,
    })
    .select("id, name, quantity")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Log the initial stock transaction if quantity > 0
  if (Number(quantity) > 0) {
    await supabase.from("inventory_transactions").insert({
      inventory_item_id: item.id,
      transaction_type: "add",
      quantity_delta: Number(quantity),
      notes: "Initial stock",
      user_id: user.id,
      boat_id: boatId,
    });
  }

  return Response.json({ ok: true, item });
}
