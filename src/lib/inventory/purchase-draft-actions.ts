"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dismissPurchaseDraft } from "@/lib/inventory-purchase-drafts";

export type PurchaseItemAction = {
  name: string;
  quantity: number;
  unit: string | null;
  price: number | null;
  notes: string | null;
  // if set, update this existing item; otherwise create new
  existingItemId: string | null;
};

export async function applyPurchaseDraft(
  draftId: string,
  boatId: string,
  items: PurchaseItemAction[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  for (const item of items) {
    if (item.existingItemId) {
      // Add stock to existing item
      const { error } = await supabase.rpc("adjust_inventory_stock", {
        p_inventory_item_id: item.existingItemId,
        p_transaction_type: "add",
        p_quantity_delta: item.quantity,
        p_notes: item.notes ?? `Purchase via email`,
      });
      if (error) return { error: error.message };
    } else {
      // Create new inventory item
      const { error } = await supabase.from("inventory_items").insert({
        boat_id: boatId,
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
        is_critical: false,
      });
      if (error) return { error: error.message };
    }
  }

  await dismissPurchaseDraft(draftId);
  revalidatePath("/inventory");
  revalidatePath("/chat");
  return {};
}
