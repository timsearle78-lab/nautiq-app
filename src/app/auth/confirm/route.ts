import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_token", origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin));
  }

  // For email confirmation (signup), redirect to login with a one-time cookie.
  // For other flows (password reset etc.) honour the `next` param as before.
  if (type === "signup" || type === "email") {
    const response = NextResponse.redirect(new URL("/login", origin));
    response.cookies.set("__nautiq_email_confirmed", "1", {
      httpOnly: true,
      path: "/login",
      maxAge: 300, // expires in 5 minutes
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.redirect(new URL(next, origin));
}
