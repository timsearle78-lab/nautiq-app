"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MaintenanceDraft = {
  id: string;
  boat_id: string | null;
  email_subject: string | null;
  parsed_component_name: string | null;
  parsed_work_done: string | null;
  parsed_performed_at: string | null;
  parsed_engine_hours: number | null;
  parsed_vendor: string | null;
  parsed_notes: string | null;
  created_at: string;
};

export async function getPendingDrafts(): Promise<MaintenanceDraft[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("maintenance_drafts")
    .select("id, boat_id, email_subject, parsed_component_name, parsed_work_done, parsed_performed_at, parsed_engine_hours, parsed_vendor, parsed_notes, created_at")
    .eq("user_id", user.id)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as MaintenanceDraft[];
}

export async function dismissDraft(draftId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("maintenance_drafts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("user_id", user.id);

  revalidatePath("/chat");
}
