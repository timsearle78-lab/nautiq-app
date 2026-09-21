import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: boats, error } = await supabase
    .from("boats")
    .select("id, name, user_id")
    .order("created_at", { ascending: true });

  const { data: members } = await supabase
    .from("boat_members")
    .select("boat_id, user_id");

  return Response.json({
    userId: user?.id ?? null,
    boats: boats ?? [],
    boatsError: error?.message ?? null,
    memberRows: members ?? [],
  });
}
