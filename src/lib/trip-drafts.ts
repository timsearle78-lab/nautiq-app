"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TripDraftFromEmail = {
  id: string;
  boat_id: string | null;
  email_subject: string | null;
  parsed_started_at: string | null;
  parsed_ended_at: string | null;
  parsed_engine_hours: number | null;
  parsed_fuel_litres: number | null;
  parsed_notes: string | null;
  parsed_issues: string | null;
  created_at: string;
};

export async function getPendingTripDrafts(): Promise<TripDraftFromEmail[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("trip_drafts")
    .select("id, boat_id, email_subject, parsed_started_at, parsed_ended_at, parsed_engine_hours, parsed_fuel_litres, parsed_notes, parsed_issues, created_at")
    .eq("user_id", user.id)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as TripDraftFromEmail[];
}

export async function dismissTripDraft(draftId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("trip_drafts")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("user_id", user.id);

  revalidatePath("/chat");
}
