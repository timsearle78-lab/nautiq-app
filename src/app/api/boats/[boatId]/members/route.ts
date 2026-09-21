import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// GET /api/boats/[boatId]/members — list members with emails (owner only)
export async function GET(_req: Request, { params }: { params: Promise<{ boatId: string }> }) {
  const { boatId } = await params;

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

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user: u } } = await adminClient.auth.admin.getUserById(m.user_id);
      return { id: m.id, user_id: m.user_id, email: u?.email ?? "unknown", joined_at: m.joined_at };
    })
  );

  return Response.json(enriched);
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
