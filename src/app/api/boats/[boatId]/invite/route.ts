import { createClient } from "@/lib/supabase/server";

// POST /api/boats/[boatId]/invite — create a new invite code (owner only)
export async function POST(_req: Request, { params }: { params: Promise<{ boatId: string }> }) {
  const { boatId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Verify ownership
  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return new Response("Not found", { status: 404 });

  // Expire any existing unused codes for this boat
  await supabase
    .from("boat_invites")
    .update({ expires_at: new Date().toISOString() })
    .eq("boat_id", boatId)
    .is("used_at", null)
    .eq("created_by", user.id);

  const code = Array.from(crypto.getRandomValues(new Uint8Array(8))).map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10);
  const { data: invite, error } = await supabase
    .from("boat_invites")
    .insert({ boat_id: boatId, created_by: user.id, code })
    .select("code, expires_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(invite);
}

// DELETE /api/boats/[boatId]/invite — revoke all pending invites (owner only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ boatId: string }> }) {
  const { boatId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("user_id", user.id)
    .single();
  if (!boat) return new Response("Not found", { status: 404 });

  await supabase
    .from("boat_invites")
    .update({ expires_at: new Date().toISOString() })
    .eq("boat_id", boatId)
    .is("used_at", null);

  return new Response(null, { status: 204 });
}
