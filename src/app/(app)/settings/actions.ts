"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: string };

export async function updateBoat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const boatId = formData.get("boat_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string) || null;

  if (!name) return { error: "Boat name is required" };

  const { error } = await supabase
    .from("boats")
    .update({ name, type })
    .eq("id", boatId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "Saved" };
}

export async function addBoat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string) || null;

  if (!name) return { error: "Boat name is required" };

  const { data, error } = await supabase
    .from("boats")
    .insert({ user_id: user.id, name, type })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.rpc("seed_boat_templates", { p_boat_id: data.id });

  revalidatePath("/settings");
  return { success: `${name} added` };
}

export async function addSystem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const boatId = formData.get("boat_id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "System name is required" };

  const { error } = await supabase
    .from("systems")
    .insert({ boat_id: boatId, name });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "System added" };
}

export async function deleteSystem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const systemId = formData.get("system_id") as string;

  const { error } = await supabase
    .from("systems")
    .delete()
    .eq("id", systemId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "Deleted" };
}
