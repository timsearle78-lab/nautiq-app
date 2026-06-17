"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: string };

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) throw new Error("Invalid number");
  return parsed;
}

export async function updateInventoryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id") ?? "").trim();
  const boat_id = String(formData.get("boat_id") ?? "").trim();
  const component_id = String(formData.get("component_id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const manufacturer = String(formData.get("manufacturer") ?? "").trim() || null;
  const quantity = parseRequiredNumber(formData.get("quantity"));
  const minimum_quantity = parseOptionalNumber(formData.get("minimum_quantity"));
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const storage_location = String(formData.get("storage_location") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const is_critical = formData.get("is_critical") === "on";

  if (!name) return { error: "Item name is required." };

  const { error } = await supabase
    .from("inventory_items")
    .update({ component_id, name, category, sku, manufacturer, quantity, minimum_quantity, unit, storage_location, notes, is_critical })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function deleteInventoryItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id") ?? "").trim();
  const boat_id = String(formData.get("boat_id") ?? "").trim();

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  redirect("/inventory");
}
