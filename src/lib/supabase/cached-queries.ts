import { cache } from "react";
import { createClient } from "./server";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getUserBoats = cache(async () => {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  // Get boats user owns
  const { data: ownedBoats } = await supabase
    .from("boats")
    .select("id, name, user_id, image_url, type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Get boats user is a member of
  const { data: memberRows } = await supabase
    .from("boat_members")
    .select("boat_id")
    .eq("user_id", user.id);

  const memberBoatIds = (memberRows ?? []).map((r: { boat_id: string }) => r.boat_id);

  if (memberBoatIds.length === 0) return ownedBoats ?? [];

  const { data: memberBoats } = await supabase
    .from("boats")
    .select("id, name, user_id, image_url, type, created_at")
    .in("id", memberBoatIds)
    .order("created_at", { ascending: true });

  const all = [...(ownedBoats ?? []), ...(memberBoats ?? [])];
  // Deduplicate by id
  return all.filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i);
});
