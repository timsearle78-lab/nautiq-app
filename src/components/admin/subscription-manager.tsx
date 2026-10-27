"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_LABELS: Record<string, string> = {
  free_lifetime:  "Free lifetime",
  trialing:       "Trialing (30-day)",
  active_monthly: "Active — monthly",
  active_annual:  "Active — annual",
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

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function defaultTrialEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

type Props = {
  userId: string;
  currentPlan: string;
  currentEarlyAdopter: boolean;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
};

export function SubscriptionManager({ userId, currentPlan, currentEarlyAdopter, trialEndsAt, currentPeriodEndsAt }: Props) {
  const [plan, setPlan] = useState(currentPlan);
  const [earlyAdopter, setEarlyAdopter] = useState(currentEarlyAdopter);
  const [trialEnd, setTrialEnd] = useState(toDateInputValue(trialEndsAt));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan, earlyAdopter, trialEndsAt: plan === "trialing" ? trialEnd || null : undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(data.error ?? "Failed to save");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-5">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Subscription</div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${PLAN_COLORS[plan] ?? "bg-slate-100 text-slate-600"}`}>
          {PLAN_LABELS[plan] ?? plan}
        </span>
        {earlyAdopter && (
          <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 bg-amber-100 text-amber-700">
            Early adopter
          </span>
        )}
        {trialEndsAt && (
          <span className="text-xs text-slate-400">Trial ends {new Date(trialEndsAt).toLocaleDateString("en-NZ")}</span>
        )}
        {currentPeriodEndsAt && (
          <span className="text-xs text-slate-400">Period ends {new Date(currentPeriodEndsAt).toLocaleDateString("en-NZ")}</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Plan</label>
          <select
            value={plan}
            onChange={(e) => {
              const next = e.target.value;
              setPlan(next);
              if (next === "trialing" && !trialEnd) setTrialEnd(defaultTrialEnd());
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
          >
            {Object.entries(PLAN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {plan === "trialing" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Trial ends</label>
            <input
              type="date"
              value={trialEnd}
              onChange={(e) => setTrialEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
            />
          </div>
        )}

        <div className="flex items-end">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={earlyAdopter}
              onChange={(e) => setEarlyAdopter(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Early adopter</span>
              <p className="text-xs text-slate-400">Locks in discounted pricing</p>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl btn-primary px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save subscription"}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
