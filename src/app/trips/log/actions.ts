"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveTripSchema } from "@/lib/validation/trip";
import { createClient } from "@/lib/supabase/server";

function normaliseText(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function saveTripAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to save a trip.");
  }

  const parsed = saveTripSchema.safeParse({
    boatId: formData.get("boatId"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
    engineHoursDelta: formData.get("engineHoursDelta"),
    engineHoursStart: formData.get("engineHoursStart"),
    engineHoursEnd: formData.get("engineHoursEnd"),
    fuelAddedLitres: formData.get("fuelAddedLitres"),
    notes: formData.get("notes"),
    rawInput: formData.get("rawInput"),
    source: formData.get("source") || "manual",
  });

  if (!parsed.success) {
    throw new Error("Invalid trip data.");
  }

  const input = parsed.data;

  const derivedDelta =
    input.engineHoursStart !== null && input.engineHoursEnd !== null
      ? Number((input.engineHoursEnd - input.engineHoursStart).toFixed(2))
      : null;

  const engineHoursDelta =
    derivedDelta !== null ? derivedDelta : input.engineHoursDelta;

  if (engineHoursDelta === null || engineHoursDelta < 0) {
    throw new Error("Could not determine engine hours used for this trip.");
  }

  const { data: boat, error: boatError } = await supabase
    .from("boats")
    .select("id")
    .eq("id", input.boatId)
    .eq("user_id", user.id)
    .single();

  if (boatError || !boat) {
    throw new Error("Boat not found or access denied.");
  }

  const insertPayload = {
    boat_id: input.boatId,
    user_id: user.id,
    started_at: input.startedAt,
    ended_at: input.endedAt || null,
    engine_hours_delta: engineHoursDelta,
    engine_hours_start: input.engineHoursStart,
    engine_hours_end: input.engineHoursEnd,
    fuel_added_litres: input.fuelAddedLitres,
    notes: normaliseText(input.notes),
    raw_input: normaliseText(input.rawInput),
    source: input.source,
  };

  const { error: insertError } = await supabase
    .from("trips")
    .insert(insertPayload);

  if (insertError) {
    throw new Error(`Failed to save trip: ${insertError.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard?boat=${input.boatId}`);
  revalidatePath("/trips");
  revalidatePath(`/trips?boat=${input.boatId}`);
  revalidatePath("/maintenance");
  revalidatePath("/planner");

  redirect(`/dashboard?boat=${input.boatId}`);
}