import { createClient } from "@/lib/supabase/server";

type InventoryItem = {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  is_critical: boolean;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { boatId, items }: { boatId: string; items: InventoryItem[] } = await req.json();

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const rows = (items ?? []).map((item) => ({
    user_id: user.id,
    boat_id: boatId,
    name: item.name,
    category: item.category,
    unit: item.unit || null,
    quantity: item.quantity,
    minimum_quantity: Math.max(1, Math.floor(item.quantity / 2)),
    is_critical: item.is_critical,
  }));

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(rows)
    .select("id, name, quantity");

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Log initial stock transactions
  const transactions = (data ?? []).map((item, i) => ({
    inventory_item_id: item.id,
    transaction_type: "add",
    quantity_delta: rows[i].quantity,
    notes: "Onboarding stock",
    user_id: user.id,
    boat_id: boatId,
  })).filter((t) => t.quantity_delta > 0);

  if (transactions.length > 0) {
    await supabase.from("inventory_transactions").insert(transactions);
  }

  return Response.json({ ok: true, count: data?.length ?? 0 });
}
