import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/maintenance", "/inventory", "/components", "/onboarding", "/settings", "/health"];

export async function updateSession(request: NextRequest) {
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
