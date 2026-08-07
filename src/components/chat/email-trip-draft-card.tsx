"use client";

import { useState } from "react";
import type { TripDraftFromEmail } from "@/lib/trip-drafts";
import { dismissTripDraft } from "@/lib/trip-drafts";
import { Mail } from "lucide-react";

interface Props {
  draft: TripDraftFromEmail;
  onDone: () => void;
}

function toDateValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toTimeValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

function buildIso(date: string, time: string) {
  if (!date) return null;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

export default function EmailTripDraftCard({ draft, onDone }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(toDateValue(draft.parsed_started_at) || today);
  const [startTime, setStartTime] = useState(toTimeValue(draft.parsed_started_at));
  const [endTime, setEndTime] = useState(toTimeValue(draft.parsed_ended_at));
  const [engineHours, setEngineHours] = useState(draft.parsed_engine_hours?.toString() ?? "");
  const [fuel, setFuel] = useState(draft.parsed_fuel_litres?.toString() ?? "");
  const [notes, setNotes] = useState(draft.parsed_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: draft.boat_id,
          started_at: buildIso(date, startTime),
          ended_at: buildIso(date, endTime),
          engine_hours_delta: parseFloat(engineHours) || 0,
          fuel_added_litres: fuel ? parseFloat(fuel) : null,
          notes: [notes, draft.parsed_issues ? `Issues: ${draft.parsed_issues}` : null].filter(Boolean).join("\n") || null,
          source: "email",
          raw_input: draft.email_subject,
        }),
      });
      if (res.ok) {
        setSaved(true);
        await dismissTripDraft(draft.id);
        onDone();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDismiss() {
    await dismissTripDraft(draft.id);
    onDone();
  }

  if (saved) {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Trip saved
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none";

  return (
    <div className="mx-4 mb-3 rounded-xl border border-ocean-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-ocean-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Mail size={15} className="text-ocean-500" />
          <span className="text-sm font-semibold text-slate-800">Trip from email</span>
        </div>
        <span className="text-xs font-medium text-ocean-600 bg-white border border-ocean-200 rounded-full px-2 py-0.5">
          {draft.email_subject ? `"${draft.email_subject}"` : "Email log"}
        </span>
      </div>

      <div className="px-4 pt-3 pb-0">
        <p className="text-xs text-slate-500">Review the extracted details and edit anything before saving.</p>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Departure</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Return</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Engine hours</label>
            <input type="number" min="0" step="0.1" value={engineHours} onChange={(e) => setEngineHours(e.target.value)} className={inputCls} placeholder="e.g. 1.5" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fuel added (L)</label>
            <input type="number" min="0" step="0.5" value={fuel} onChange={(e) => setFuel(e.target.value)} className={inputCls} placeholder="optional" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </div>

        {draft.parsed_issues && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-700 mb-0.5">Issues noted</p>
            <p className="text-xs text-amber-600">{draft.parsed_issues}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving || !date}
          className="flex-1 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Trip"}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
