import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { code } = await req.json();
  if (!code) return Response.json({ error: "code required" }, { status: 400 });

  // Fetch the invite
  const { data: invite, error } = await supabase
    .from("boat_invites")
    .select("id, boat_id, used_at, expires_at, created_by")
    .eq("code", code)
    .single();

  if (error || !invite) return Response.json({ error: "Invalid invite code" }, { status: 404 });
  if (invite.used_at) return Response.json({ error: "This invite has already been used" }, { status: 409 });
  if (new Date(invite.expires_at) < new Date()) return Response.json({ error: "This invite has expired" }, { status: 410 });

  // Don't let the boat owner join their own boat as a member
  const { data: boat } = await supabase.from("boats").select("user_id").eq("id", invite.boat_id).single();
  if (boat?.user_id === user.id) return Response.json({ error: "You already own this boat" }, { status: 409 });

  // Check not already a member
  const { data: existing } = await supabase
    .from("boat_members")
    .select("id")
    .eq("boat_id", invite.boat_id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    const { error: insertErr } = await supabase.from("boat_members").insert({
      boat_id: invite.boat_id,
      user_id: user.id,
      invited_by: invite.created_by,
    });
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });
  }

  // Mark invite as used
  await supabase
    .from("boat_invites")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("id", invite.id);

  return Response.json({ success: true });
}
