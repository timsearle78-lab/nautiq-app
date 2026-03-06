"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: string;
};

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid number");
  }
  return parsed;
}

export async function createInventoryItem(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: "You must be signed in." };
    }

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

    if (!boat_id) return { error: "Boat is required." };
    if (!name) return { error: "Item name is required." };
    if (quantity < 0) return { error: "Quantity cannot be negative." };
    if (minimum_quantity != null && minimum_quantity < 0) {
      return { error: "Minimum quantity cannot be negative." };
    }

    const { error } = await supabase.from("inventory_items").insert({
      user_id: user.id,
      boat_id,
      component_id,
      name,
      category,
      sku,
      manufacturer,
      quantity,
      minimum_quantity,
      unit,
      storage_location,
      notes,
      is_critical,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/inventory?boat=${boat_id}`);
    revalidatePath("/inventory");
    revalidatePath(`/dashboard?boat=${boat_id}`);
    revalidatePath("/dashboard");
    revalidatePath(`/activity?boat=${boat_id}`);
    revalidatePath("/activity");

    return { success: "Inventory item created." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create inventory item.",
    };
  }
}

export async function adjustInventoryStock(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createClient();

    const boat_id = String(formData.get("boat_id") ?? "").trim();
    const inventory_item_id = String(formData.get("inventory_item_id") ?? "").trim();
    const transaction_type = String(formData.get("transaction_type") ?? "").trim();
    const quantity_delta = parseRequiredNumber(formData.get("quantity_delta"));
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!boat_id) return { error: "Boat is required." };
    if (!inventory_item_id) return { error: "Inventory item is required." };
    if (!["add", "consume", "correct"].includes(transaction_type)) {
      return { error: "Invalid transaction type." };
    }
    if (transaction_type !== "correct" && quantity_delta <= 0) {
      return { error: "Quantity must be greater than zero." };
    }

    const { error } = await supabase.rpc("adjust_inventory_stock", {
      p_inventory_item_id: inventory_item_id,
      p_transaction_type: transaction_type,
      p_quantity_delta: quantity_delta,
      p_notes: notes,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/inventory?boat=${boat_id}`);
    revalidatePath("/inventory");
    revalidatePath(`/dashboard?boat=${boat_id}`);
    revalidatePath("/dashboard");
    revalidatePath(`/activity?boat=${boat_id}`);
    revalidatePath("/activity");

    return { success: "Stock updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to adjust stock.",
    };
  }
}