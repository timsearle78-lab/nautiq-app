"use client";

import { useState } from "react";
import type { TripDraft } from "@/lib/ai/generateTripDraft";

interface TripDraftCardProps {
  draft: TripDraft;
  boatId: string;
  onSaved?: () => void;
  onDismiss?: () => void;
}

function toDateValue(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function toTimeValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5); // HH:MM
}

function buildIso(date: string, time: string) {
  if (!date) return null;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

export default function TripDraftCard({ draft, boatId, onSaved, onDismiss }: TripDraftCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(toDateValue(draft.started_at) || today);
  const [startTime, setStartTime] = useState(toTimeValue(draft.started_at));
  const [endTime, setEndTime] = useState(toTimeValue(draft.ended_at));
  const [engineHours, setEngineHours] = useState(draft.engine_hours_delta?.toString() ?? "");
  const [fuel, setFuel] = useState(draft.fuel_added_litres?.toString() ?? "");
  const [notes, setNotes] = useState(draft.notes ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          started_at: buildIso(date, startTime),
          ended_at: buildIso(date, endTime),
          engine_hours_delta: parseFloat(engineHours) || 0,
          fuel_added_litres: fuel ? parseFloat(fuel) : null,
          notes,
          source: draft.source,
          raw_input: draft.raw_input,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }

  if (dismissed) return null;

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Trip saved
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none";

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">⚓</span>
          <span className="text-sm font-semibold text-slate-800">Trip Draft</span>
        </div>
        <span className="text-xs font-medium text-ocean-600 bg-ocean-50 border border-ocean-200 rounded-full px-2 py-0.5">AI extracted</span>
      </div>
      <div className="px-4 pt-3 pb-0">
        <p className="text-xs text-slate-500">Review the details below and edit anything before saving.</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Start / End times */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Departure</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Return</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Engine hours + fuel */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Engine hours</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={engineHours}
              onChange={(e) => setEngineHours(e.target.value)}
              className={inputCls}
              placeholder="e.g. 0.75"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fuel added (L)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              className={inputCls}
              placeholder="optional"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>

        {draft.issues_observed.filter(s => s && !/^no issues?$/i.test(s.trim())).length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-700 mb-1">Issues noted</p>
            {draft.issues_observed.filter(s => s && !/^no issues?$/i.test(s.trim())).map((issue, i) => (
              <p key={i} className="text-xs text-amber-600">• {issue}</p>
            ))}
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
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
