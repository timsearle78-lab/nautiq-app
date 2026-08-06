"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
