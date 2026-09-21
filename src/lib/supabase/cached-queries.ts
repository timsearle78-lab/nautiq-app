import { cache } from "react";
import { createClient } from "./server";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getUserBoats = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boats")
    .select("id, name, user_id, image_url, type, created_at")
    .order("created_at", { ascending: true });
  return data ?? [];
});
