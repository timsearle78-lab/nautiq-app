import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/maintenance", "/inventory", "/components", "/onboarding", "/settings", "/health", "/trips", "/costs", "/help", "/subscribe"];

// Routes that require an active subscription (write/AI actions)
// Expired/cancelled users are redirected to /subscribe instead
const WRITE_PREFIXES = ["/chat", "/api/trips", "/api/maintenance", "/api/inventory", "/api/boats", "/api/components", "/api/watch"];

export type SubscriptionPlan =
  | "free_lifetime"
  | "trialing"
  | "active_monthly"
  | "active_annual"
  | "expired"
  | "cancelled";

export function hasActiveAccess(plan: SubscriptionPlan, trialEndsAt: string | null, currentPeriodEndsAt: string | null): boolean {
  if (plan === "free_lifetime" || plan === "active_monthly" || plan === "active_annual") return true;
  if (plan === "trialing" && trialEndsAt && new Date(trialEndsAt) > new Date()) return true;
  // Cancelled but still within paid period
  if (plan === "cancelled" && currentPeriodEndsAt && new Date(currentPeriodEndsAt) > new Date()) return true;
  return false;
}

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          const persist = request.cookies.get("nautiq_remember")?.value === "1";
          cookiesToSet.forEach(({ name, value, options }) => {
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
  const user = data.user;

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Check subscription for authenticated users on protected routes
  if (user && isProtected && pathname !== "/subscribe") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, trial_ends_at, current_period_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = (sub?.plan ?? "expired") as SubscriptionPlan;
    const active = hasActiveAccess(plan, sub?.trial_ends_at ?? null, sub?.current_period_ends_at ?? null);

    if (!active) {
      // Write routes → 402 for API, redirect for pages
      const isWriteRoute = WRITE_PREFIXES.some((p) => pathname.startsWith(p));
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Subscription required" }), {
          status: 402,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (isWriteRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/subscribe";
        return NextResponse.redirect(url);
      }
      // Read-only routes: allow through but set a header so pages can show the upgrade banner
      supabaseResponse.headers.set("x-subscription-status", "expired");
    } else {
      supabaseResponse.headers.set("x-subscription-status", plan);
    }
  }

  return supabaseResponse;
}
