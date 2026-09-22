import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/maintenance", "/inventory", "/components", "/onboarding", "/settings", "/health"];

const PUBLIC_API_CORS_ORIGINS = ["https://nautiq.cloud", "https://www.nautiq.cloud"];
const PUBLIC_API_PATHS = ["/api/waitlist"];

export async function updateSession(request: NextRequest) {
  // Handle CORS for public API routes before touching auth — the middleware's
  // NextResponse.next() can shadow headers set by the route handler itself.
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    const origin = request.headers.get("origin") ?? "";
    const allowedOrigin = PUBLIC_API_CORS_ORIGINS.includes(origin) ? origin : PUBLIC_API_CORS_ORIGINS[0];
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const res = NextResponse.next({ request });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Pass updated cookies to the request so server components see them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Re-create the response with the updated request so Next.js RSC gets the new cookies
          supabaseResponse = NextResponse.next({ request });
          const persist = request.cookies.get("nautiq_remember")?.value === "1";
          cookiesToSet.forEach(({ name, value, options }) => {
            // If user didn't choose "stay signed in", make auth cookies session-only
            const cookieOptions =
              !persist && name.startsWith("sb-")
                ? { ...options, maxAge: undefined, expires: undefined }
                : options;
            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
