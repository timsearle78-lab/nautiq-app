"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CheckinActionState = {
  error?: string;
  success?: boolean;
};

export async function logCheckin(
  _prevState: CheckinActionState,
  formData: FormData
): Promise<CheckinActionState> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: "You must be signed in." };

    const boatId = String(formData.get("boat_id") ?? "").trim();
    const checkedAt = String(formData.get("checked_at") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!boatId) return { error: "Missing boat." };
    if (!checkedAt) return { error: "Please enter the visit date." };

    // Verify the user owns this boat
    const { data: boat } = await supabase
      .from("boats")
      .select("id")
      .eq("id", boatId)
      .eq("user_id", user.id)
      .single();
    if (!boat) return { error: "Boat not found." };

    const { error: insertError } = await supabase
      .from("boat_checkins")
      .insert({ boat_id: boatId, user_id: user.id, checked_at: checkedAt, notes });

    if (insertError) return { error: insertError.message };

    revalidatePath("/chat");
    revalidatePath("/health");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
