import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

export async function DELETE(req: Request) {
  // 5 delete attempts per IP per hour
  if (!rateLimit(`account-delete:${getClientIp(req)}`, 5, 60 * 60 * 1000)) {
    return tooManyRequests();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  // Get all boat IDs for this user
  const { data: boats } = await supabase
    .from("boats")
    .select("id")
    .eq("user_id", userId);

  const boatIds = (boats ?? []).map((b) => b.id);

  if (boatIds.length > 0) {
    // Delete child records in dependency order
    await supabase.from("maintenance_events").delete().in("boat_id", boatIds);
    await supabase.from("inventory_items").delete().in("boat_id", boatIds);
    await supabase.from("trips").delete().in("boat_id", boatIds);
    await supabase.from("components").delete().in("boat_id", boatIds);
    await supabase.from("systems").delete().in("boat_id", boatIds);
    await supabase.from("boats").delete().in("id", boatIds);
  }

  // Delete remaining user-owned records (cascades handle some, but be explicit)
  await supabase.from("maintenance_drafts").delete().eq("user_id", userId);
  await supabase.from("trip_drafts").delete().eq("user_id", userId);
  await supabase.from("user_settings").delete().eq("user_id", userId);
  await supabase.from("component_overdue_notifications").delete().eq("user_id", userId);

  // Delete the auth user using the service role admin client
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete auth user:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
