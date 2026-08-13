"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseOptionalNumber } from "@/lib/parse-form-data";

export type TripActionState = { error?: string; success?: string };

export async function updateTrip(
  _prev: TripActionState,
  formData: FormData
): Promise<TripActionState> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: "You must be signed in." };

    const tripId = String(formData.get("trip_id") ?? "").trim();
    const startedAt = String(formData.get("started_at") ?? "").trim() || null;
    const endedAt = String(formData.get("ended_at") ?? "").trim() || null;
    const engineHoursDelta = parseOptionalNumber(formData.get("engine_hours_delta"));
    const fuelAddedLitres = parseOptionalNumber(formData.get("fuel_added_litres"));
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!tripId) return { error: "Trip ID is required." };

    const { error } = await supabase
      .from("trips")
      .update({ started_at: startedAt, ended_at: endedAt, engine_hours_delta: engineHoursDelta, fuel_added_litres: fuelAddedLitres, notes })
      .eq("id", tripId)
      .eq("user_id", user.id);

    if (error) return { error: `Failed to update: ${error.message}` };

    revalidatePath("/trips");
    return { success: "Trip updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update." };
  }
}

export async function deleteTrip(tripId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // RLS ensures the trip belongs to the user's boat
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}
