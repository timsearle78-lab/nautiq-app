import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// GET /api/boats/[boatId]/members — list members with emails (owner or co-owner)
export async function GET(_req: Request, { params }: { params: Promise<{ boatId: string }> }) {
  const { boatId } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Allow access for the boat owner OR any co-owner
  const [{ data: boat }, { data: memberRow }] = await Promise.all([
    supabase.from("boats").select("id, user_id, created_at").eq("id", boatId).eq("user_id", user.id).maybeSingle(),
    supabase.from("boat_members").select("id").eq("boat_id", boatId).eq("user_id", user.id).maybeSingle(),
  ]);

  // If not the owner, fetch the boat separately to get owner info
  const boatData = boat ?? (await supabase.from("boats").select("id, user_id, created_at").eq("id", boatId).maybeSingle()).data;
  if (!boat && !memberRow) return new Response("Not found", { status: 404 });

  const { data: members } = await supabase
    .from("boat_members")
    .select("id, user_id, joined_at")
    .eq("boat_id", boatId)
    .order("joined_at", { ascending: true });

  // Enrich with email using service role
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Include the boat owner as the first entry
  const ownerEntry = await (async () => {
    if (!boatData) return null;
    const { data: { user: ownerUser } } = await adminClient.auth.admin.getUserById(boatData.user_id);
    return { id: `owner-${boatData.user_id}`, user_id: boatData.user_id, email: ownerUser?.email ?? "unknown", joined_at: boatData.created_at, role: "owner" as const };
  })();

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user: u } } = await adminClient.auth.admin.getUserById(m.user_id);
      return { id: m.id, user_id: m.user_id, email: u?.email ?? "unknown", joined_at: m.joined_at, role: "co-owner" as const };
    })
  );

  const result = [
    ...(ownerEntry ? [ownerEntry] : []),
    ...enriched,
  ];

  return Response.json(result);
}

// DELETE /api/boats/[boatId]/members?memberId=xxx — remove a member (owner only)
export async function DELETE(req: Request, { params }: { params: Promise<{ boatId: string }> }) {
  const { boatId } = await params;
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return Response.json({ error: "memberId required" }, { status: 400 });

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return new Response("Not found", { status: 404 });

  await supabase.from("boat_members").delete().eq("id", memberId).eq("boat_id", boatId);

  return new Response(null, { status: 204 });
}
