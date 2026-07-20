"use client";

import React, { useActionState } from "react";
import { updateNotificationPreferences, triggerNotificationsNow } from "@/app/(app)/settings/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";
import { Bell, Send } from "lucide-react";

type Prefs = {
  email: string;
  health_summary: "none" | "daily" | "weekly";
  health_summary_day: number;
  overdue_alerts: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function NotificationPreferencesForm({ prefs, userEmail }: { prefs: Prefs | null; userEmail: string }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, {});
  const [checkState, checkAction, checkPending] = useActionState(triggerNotificationsNow, {});

  const defaults: Prefs = prefs ?? {
    email: userEmail,
    health_summary: "none",
    health_summary_day: 1,
    overdue_alerts: false,
  };

  const [healthSummary, setHealthSummary] = React.useState(defaults.health_summary);

  return (
    <div className="space-y-5">
      <form key={state.savedAt} action={action} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notification email</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaults.email}
            className={inputCls}
            placeholder="you@example.com"
          />
          <p className="mt-1 text-xs text-slate-400">Defaults to your account email. Change this to send notifications to a different address.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Boat health summary</label>
          <select name="health_summary" value={healthSummary} onChange={e => setHealthSummary(e.target.value as Prefs["health_summary"])} className={inputCls}>
            <option value="none">Off — no health summary emails</option>
            <option value="daily">Daily — sent each day while issues exist</option>
            <option value="weekly">Weekly — sent once a week while issues exist</option>
          </select>
          <p className="mt-1 text-xs text-slate-400">Emails are only sent while your boat health needs attention. When everything is OK, no emails are sent.</p>
        </div>

        {healthSummary === "weekly" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Weekly summary day</label>
            <select name="health_summary_day" defaultValue={String(defaults.health_summary_day)} className={inputCls}>
              {DAYS.map((d, i) => (
                <option key={i} value={String(i)}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="overdue_alerts"
            defaultChecked={defaults.overdue_alerts}
            className="mt-0.5 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-700">Overdue maintenance alerts</span>
            <p className="text-xs text-slate-400 mt-0.5">Get an email when a component becomes overdue. Each component is alerted at most once every 7 days.</p>
          </div>
        </label>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
        )}
        {state.success && <SaveSuccessBanner message={state.success} />}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          <Bell size={14} />
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </form>

      <form action={checkAction} className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={checkPending}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Send size={14} />
          {checkPending ? "Sending…" : "Check now"}
        </button>
        {checkState.error && (
          <span className="text-sm text-red-600">{checkState.error}</span>
        )}
        {checkState.success && (
          <span className="text-sm text-green-600">{checkState.success}</span>
        )}
      </form>
    </div>
  );
}
