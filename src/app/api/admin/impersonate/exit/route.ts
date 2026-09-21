import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("__nautiq_impersonating");

  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/admin", origin), { status: 303 });
}
