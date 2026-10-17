"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ParsedPurchaseItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  notes: string | null;
};

export type InventoryPurchaseDraft = {
  id: string;
  boat_id: string | null;
  email_subject: string | null;
  parsed_items: ParsedPurchaseItem[];
  created_at: string;
};

export async function getPendingPurchaseDrafts(): Promise<InventoryPurchaseDraft[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("inventory_purchase_drafts")
    .select("id, boat_id, email_subject, parsed_items, created_at")
    .eq("user_id", user.id)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as InventoryPurchaseDraft[];
}

export async function dismissPurchaseDraft(draftId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("inventory_purchase_drafts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("user_id", user.id);

  revalidatePath("/chat");
}
