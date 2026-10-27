import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasActiveAccess, type SubscriptionPlan } from "@/lib/supabase/proxy";

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, trial_ends_at, current_period_ends_at, early_adopter")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = (sub?.plan ?? "expired") as SubscriptionPlan;
  const active = hasActiveAccess(plan, sub?.trial_ends_at ?? null, sub?.current_period_ends_at ?? null);

  // Already active — send them home
  if (active) redirect("/");

  const isEarlyAdopter = sub?.early_adopter ?? false;
  const monthlyPrice = isEarlyAdopter ? "$2.99" : "$4.99";
  const annualPrice = isEarlyAdopter ? "$29.99" : "$49.99";
  const annualMonthly = isEarlyAdopter ? "$2.50" : "$4.17";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Your trial has ended</h1>
          <p className="text-slate-500 text-sm">
            Subscribe to keep logging trips, maintenance, and getting AI insights for your boat.
          </p>
          {isEarlyAdopter && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 border border-ocean-200 px-3 py-1 text-xs font-medium text-ocean-700">
              Early adopter pricing locked in
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {/* Monthly */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Monthly</span>
              <span className="text-xl font-bold text-slate-900">{monthlyPrice}<span className="text-sm font-normal text-slate-400">/mo</span></span>
            </div>
            <p className="text-xs text-slate-400">Billed monthly. Cancel any time.</p>
            <button disabled className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white opacity-60 cursor-not-allowed">
              Subscribe monthly — coming soon
            </button>
          </div>

          {/* Annual */}
          <div className="rounded-2xl border-2 border-ocean-500 bg-white p-5 space-y-3 shadow-sm relative">
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-ocean-500 px-3 py-0.5 text-xs font-semibold text-white">Best value</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Annual</span>
              <div className="text-right">
                <span className="text-xl font-bold text-slate-900">{annualPrice}<span className="text-sm font-normal text-slate-400">/yr</span></span>
                <p className="text-xs text-slate-400">{annualMonthly}/mo — 2 months free</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Billed once a year.</p>
            <button disabled className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white opacity-60 cursor-not-allowed">
              Subscribe annually — coming soon
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Your data is safe. Subscribe any time to pick up right where you left off.
        </p>
      </div>
    </main>
  );
}
