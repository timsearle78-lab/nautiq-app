"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BOAT_COOKIE } from "@/lib/selected-boat";

export async function selectBoat(formData: FormData) {
  const boatId = formData.get("boat_id") as string;
  const returnTo = (formData.get("return_to") as string) || "/chat";
  const store = await cookies();
  store.set(BOAT_COOKIE, boatId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect(returnTo);
}
