import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

type BulkItem = {
  name: string;
  category?: string | null;
  quantity: number;
  minimum_quantity?: number | null;
  unit?: string | null;
  is_critical?: boolean;
  expiry_date?: string | null;
  last_checked?: string | null;
};

export async function POST(req: Request) {
  if (!rateLimit(`inventory-bulk-add:${getClientIp(req)}`, 20, 60 * 60 * 1000)) {
    return tooManyRequests();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { boatId, items }: { boatId: string; items: BulkItem[] } = await req.json();

  if (!boatId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "boatId and items are required." }, { status: 400 });
  }

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .single();
  if (!boat) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const rows = items
    .filter((item) => item.name?.trim())
    .map((item) => ({
      user_id: user.id,
      boat_id: boatId,
      name: item.name.trim(),
      category: item.category?.trim() || null,
      quantity: Number(item.quantity) || 0,
      minimum_quantity: item.minimum_quantity != null ? Number(item.minimum_quantity) : null,
      unit: item.unit?.trim() || null,
      is_critical: item.is_critical ?? false,
      expiry_date: item.expiry_date || null,
      last_checked: item.last_checked || null,
      is_fuel_source: false,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid items to save." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(rows)
    .select("id, name, quantity");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
