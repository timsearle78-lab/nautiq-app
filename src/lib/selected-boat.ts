import { cookies } from "next/headers";

export const BOAT_COOKIE = "nautiq_boat";

export async function getSelectedBoatId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(BOAT_COOKIE)?.value;
}
