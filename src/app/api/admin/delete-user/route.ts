import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function DELETE(req: Request) {
  // Verify caller is an authenticated admin
  const supabase = await createClient();
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller || !ADMIN_EMAILS.includes(caller.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Prevent admin from deleting themselves via this route
  if (userId === caller.id) {
    return NextResponse.json({ error: "Use account settings to delete your own account" }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all boat IDs for the target user
  const { data: boats } = await adminClient
    .from("boats")
    .select("id")
    .eq("user_id", userId);

  const boatIds = (boats ?? []).map((b: { id: string }) => b.id);

  if (boatIds.length > 0) {
    await adminClient.from("maintenance_events").delete().in("boat_id", boatIds);
    await adminClient.from("inventory_items").delete().in("boat_id", boatIds);
    await adminClient.from("trips").delete().in("boat_id", boatIds);
    await adminClient.from("components").delete().in("boat_id", boatIds);
    await adminClient.from("systems").delete().in("boat_id", boatIds);
    await adminClient.from("boats").delete().in("id", boatIds);
  }

  await adminClient.from("maintenance_drafts").delete().eq("user_id", userId);
  await adminClient.from("trip_drafts").delete().eq("user_id", userId);
  await adminClient.from("notification_preferences").delete().eq("user_id", userId);
  await adminClient.from("component_overdue_notifications").delete().eq("user_id", userId);

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete auth user:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
