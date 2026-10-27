"use client";

import Link from "next/link";
import { useState } from "react";

const PLAN_LABELS: Record<string, string> = {
  free_lifetime:  "Free lifetime",
  trialing:       "Free trial",
  active_monthly: "Monthly plan",
  active_annual:  "Annual plan",
  expired:        "Expired",
  cancelled:      "Cancelled",
};

const PLAN_COLORS: Record<string, string> = {
  free_lifetime:  "bg-emerald-100 text-emerald-700",
  trialing:       "bg-blue-100 text-blue-700",
  active_monthly: "bg-ocean-100 text-ocean-700",
  active_annual:  "bg-ocean-100 text-ocean-700",
  expired:        "bg-red-100 text-red-700",
  cancelled:      "bg-slate-100 text-slate-600",
};

type Props = {
  plan: string;
  earlyAdopter: boolean;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  hasStripeCustomer: boolean;
};

export function SubscriptionSection({ plan, earlyAdopter, trialEndsAt, currentPeriodEndsAt, hasStripeCustomer }: Props) {
  const [loadingPortal, setLoadingPortal] = useState(false);

  async function openPortal() {
    setLoadingPortal(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoadingPortal(false);
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${PLAN_COLORS[plan] ?? "bg-slate-100 text-slate-600"}`}>
          {PLAN_LABELS[plan] ?? plan}
        </span>
        {earlyAdopter && (
          <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 bg-amber-100 text-amber-700">
            Early adopter
          </span>
        )}
      </div>

      {plan === "trialing" && trialEndsAt && (
        <p className="text-sm text-slate-500 mb-3">
          Your free trial ends on <span className="font-medium text-slate-700">{fmtDate(trialEndsAt)}</span>.
        </p>
      )}
      {plan === "cancelled" && currentPeriodEndsAt && (
        <p className="text-sm text-slate-500 mb-3">
          Access continues until <span className="font-medium text-slate-700">{fmtDate(currentPeriodEndsAt)}</span>.
        </p>
      )}
      {(plan === "active_monthly" || plan === "active_annual") && currentPeriodEndsAt && (
        <p className="text-sm text-slate-500 mb-3">
          Next billing date: <span className="font-medium text-slate-700">{fmtDate(currentPeriodEndsAt)}</span>.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(plan === "trialing" || plan === "expired" || plan === "cancelled") && (
          <Link
            href="/subscribe"
            className="inline-flex items-center rounded-xl btn-primary px-4 py-2 text-sm font-medium text-white"
          >
            {plan === "trialing" ? "Subscribe now" : "Resubscribe"}
          </Link>
        )}
        {hasStripeCustomer && (plan === "active_monthly" || plan === "active_annual" || plan === "cancelled") && (
          <button
            onClick={openPortal}
            disabled={loadingPortal}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
          >
            {loadingPortal ? "Loading…" : "Manage billing"}
          </button>
        )}
      </div>
    </>
  );
}
