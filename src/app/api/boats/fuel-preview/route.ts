import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boatId = searchParams.get("boatId");
  if (!boatId) return Response.json({ error: "boatId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [boatRes, fuelItemRes] = await Promise.all([
    supabase
      .from("boats")
      .select("fuel_consumption_lph")
      .eq("id", boatId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("inventory_items")
      .select("id, name, quantity, unit")
      .eq("boat_id", boatId)
      .or("name.ilike.%fuel%,name.ilike.%diesel%,name.ilike.%petrol%,name.ilike.%gasoline%")
      .order("name")
      .limit(1)
      .maybeSingle(),
  ]);

  const rate = boatRes.data?.fuel_consumption_lph ? Number(boatRes.data.fuel_consumption_lph) : null;
  const fuelItem = fuelItemRes.data ?? null;

  return Response.json({ rate, fuelItem });
}
