import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  // Look up target user email
  const { data: targetData, error: targetErr } = await adminClient.auth.admin.getUserById(userId);
  if (targetErr || !targetData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const targetEmail = targetData.user.email;
  if (!targetEmail) return NextResponse.json({ error: "Target user has no email" }, { status: 400 });

  // Generate a one-time magic link token
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });

  if (linkErr || !linkData.properties?.hashed_token) {
    return NextResponse.json({ error: linkErr?.message ?? "Failed to generate link" }, { status: 500 });
  }

  // Set a cookie so the app can show the impersonation banner
  const cookieStore = await cookies();
  cookieStore.set("__nautiq_impersonating", JSON.stringify({
    adminEmail: user.email,
    adminId: user.id,
    targetEmail,
    targetId: userId,
  }), {
    httpOnly: false, // readable client-side for the banner
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  // Build a local confirm URL that exchanges the token server-side and sets cookies
  const confirmUrl = new URL("/auth/confirm", req.nextUrl.origin);
  confirmUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
  confirmUrl.searchParams.set("type", "magiclink");
  confirmUrl.searchParams.set("next", "/");

  return NextResponse.json({ actionLink: confirmUrl.toString() });
}
