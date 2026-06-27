import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/maintenance", "/inventory", "/components", "/onboarding", "/settings", "/health"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const persist = request.cookies.get("nautiq_remember")?.value === "1";
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            // If user didn't choose "stay signed in", make auth cookies session-only
            const cookieOptions =
              !persist && name.startsWith("sb-")
                ? { ...options, maxAge: undefined, expires: undefined }
                : options;
            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  const { data } = await supabase.auth.getUser();

  if (isProtected && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}