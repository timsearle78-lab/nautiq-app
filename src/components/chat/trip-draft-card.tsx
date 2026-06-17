"use client";

import { useState } from "react";
import type { TripDraft } from "@/lib/ai/generateTripDraft";

interface TripDraftCardProps {
  draft: TripDraft;
  boatId: string;
  onSaved?: () => void;
  onDismiss?: () => void;
}

export default function TripDraftCard({ draft, boatId, onSaved, onDismiss }: TripDraftCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [engineHours, setEngineHours] = useState(
    draft.engine_hours_delta?.toString() ?? ""
  );
  const [notes, setNotes] = useState(draft.notes ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          started_at: draft.started_at,
          ended_at: draft.ended_at,
          engine_hours_delta: parseFloat(engineHours) || 0,
          fuel_added_litres: draft.fuel_added_litres,
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

  if (saved) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Trip saved
      </div>
    );
  }

  const startDate = draft.started_at
    ? new Date(draft.started_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Today";

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-base">⚓</span>
        <span className="text-sm font-semibold text-slate-800">Trip Draft</span>
        <span className="ml-auto text-xs text-slate-400">{startDate}</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Engine hours
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={engineHours}
            onChange={(e) => setEngineHours(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none"
            placeholder="e.g. 2.5"
          />
        </div>

        {draft.fuel_added_litres != null && (
          <div className="text-sm text-slate-600">
            Fuel added: {draft.fuel_added_litres}L
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none resize-none"
          />
        </div>

        {draft.issues_observed.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-700 mb-1">Issues noted</p>
            {draft.issues_observed.map((issue, i) => (
              <p key={i} className="text-xs text-amber-600">• {issue}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving || !engineHours}
          className="flex-1 rounded-lg bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Trip"}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
