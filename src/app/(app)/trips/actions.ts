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

    // Fetch the trip to get the boat_id and the previous fuel value
    const { data: existingTrip } = await supabase
      .from("trips")
      .select("boat_id, fuel_added_litres")
      .eq("id", tripId)
      .eq("user_id", user.id)
      .single();

    if (!existingTrip) return { error: "Trip not found." };

    // If no fuel entered but engine hours are set, estimate from boat consumption rate
    let resolvedFuel = fuelAddedLitres;
    let fuelEstimated = false;
    if (resolvedFuel == null && engineHoursDelta != null && engineHoursDelta > 0) {
      const { data: boatData } = await supabase
        .from("boats")
        .select("fuel_consumption_lph")
        .eq("id", existingTrip.boat_id)
        .single();
      const rate = boatData?.fuel_consumption_lph ? Number(boatData.fuel_consumption_lph) : null;
      if (rate && rate > 0) {
        resolvedFuel = Math.round(engineHoursDelta * rate * 10) / 10;
        fuelEstimated = true;
      }
    }

    const { error } = await supabase
      .from("trips")
      .update({ started_at: startedAt, ended_at: endedAt, engine_hours_delta: engineHoursDelta, fuel_added_litres: resolvedFuel, notes })
      .eq("id", tripId)
      .eq("user_id", user.id);

    if (error) return { error: `Failed to update: ${error.message}` };

    // Adjust inventory if fuel changed
    const prevFuel = existingTrip.fuel_added_litres ? Number(existingTrip.fuel_added_litres) : 0;
    const newFuel = resolvedFuel ?? 0;
    const fuelDelta = newFuel - prevFuel;

    if (fuelDelta !== 0) {
      const { data: fuelItems } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("boat_id", existingTrip.boat_id)
        .or("name.ilike.%fuel%,name.ilike.%diesel%,name.ilike.%petrol%,name.ilike.%gasoline%")
        .order("name")
        .limit(1);

      const fuelItemId = fuelItems?.[0]?.id;
      if (fuelItemId) {
        if (fuelDelta > 0) {
          // More fuel used than before — consume the difference
          const noteText = fuelEstimated
            ? `Auto-estimated from ${engineHoursDelta}h engine time (trip edit)`
            : `Auto-deducted from trip edit`;
          await supabase.rpc("adjust_inventory_stock", {
            p_inventory_item_id: fuelItemId,
            p_transaction_type: "consume",
            p_quantity_delta: fuelDelta,
            p_notes: noteText,
          });
        } else {
          // Less fuel than before — add back the difference
          await supabase.rpc("adjust_inventory_stock", {
            p_inventory_item_id: fuelItemId,
            p_transaction_type: "add",
            p_quantity_delta: Math.abs(fuelDelta),
            p_notes: "Fuel adjustment from trip edit",
          });
        }
        revalidatePath("/inventory");
      }
    }

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

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath("/trips");
}
