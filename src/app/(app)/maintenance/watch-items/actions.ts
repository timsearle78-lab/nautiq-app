"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseOptionalNumber } from "@/lib/parse-form-data";
import { logMaintenance, type MaintenanceActionState } from "@/app/(app)/components/[id]/actions";

export type WatchItemState = { error?: string; success?: string; id?: string };

export async function createWatchItem(
  _prev: WatchItemState,
  formData: FormData
): Promise<WatchItemState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const boatId = String(formData.get("boat_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const componentId = String(formData.get("component_id") ?? "").trim() || null;

  if (!title) return { error: "Title is required" };
  if (!boatId) return { error: "Boat is required" };

  const { data, error } = await supabase
    .from("maintenance_watch_items")
    .insert({ user_id: user.id, boat_id: boatId, component_id: componentId, title, notes })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  return { success: "Watch item added", id: data.id };
}

export async function deleteWatchItem(
  _prev: WatchItemState,
  formData: FormData
): Promise<WatchItemState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const id = String(formData.get("id") ?? "").trim();

  // Clean up storage photos before deleting the row
  const { data: item } = await supabase
    .from("maintenance_watch_items")
    .select("photo_urls")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (item?.photo_urls?.length) {
    const paths = (item.photo_urls as string[]).map((url) => {
      const marker = "/watch-item-photos/";
      const idx = url.indexOf(marker);
      return idx !== -1 ? url.slice(idx + marker.length) : null;
    }).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("watch-item-photos").remove(paths);
  }

  const { error } = await supabase
    .from("maintenance_watch_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/maintenance");
  return { success: "Deleted" };
}

// Logs a proper maintenance event AND resolves the watch item in one action
export async function resolveWatchItem(
  prev: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  const watchItemId = String(formData.get("watch_item_id") ?? "").trim();

  // Run the standard logMaintenance action first
  const result = await logMaintenance(prev, formData);

  if (result.success && result.eventId && watchItemId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("maintenance_watch_items")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_maintenance_event_id: result.eventId,
        })
        .eq("id", watchItemId)
        .eq("user_id", user.id);
    }
    revalidatePath("/maintenance");
  }

  return result;
}
