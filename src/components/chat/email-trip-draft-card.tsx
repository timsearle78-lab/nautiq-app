"use client";

import { useState, useTransition } from "react";
import { Mail, Anchor, X, ChevronDown, ChevronUp } from "lucide-react";
import type { TripDraftFromEmail } from "@/lib/trip-drafts";
import { dismissTripDraft } from "@/lib/trip-drafts";

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
  return new Date(iso).toTimeString().slice(0, 5);
}

function buildIso(date: string, time: string) {
  if (!date) return null;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function EmailTripDraftCard({ draft, onDone }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(toDateValue(draft.parsed_started_at) || today);
  const [startTime, setStartTime] = useState(toTimeValue(draft.parsed_started_at));
  const [endTime, setEndTime] = useState(toTimeValue(draft.parsed_ended_at));
  const [engineHours, setEngineHours] = useState(draft.parsed_engine_hours?.toString() ?? "");
  const [fuel, setFuel] = useState(draft.parsed_fuel_litres?.toString() ?? "");
  const [notes, setNotes] = useState(draft.parsed_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDismissing, startDismiss] = useTransition();

  function handleDismiss() {
    startDismiss(async () => {
      await dismissTripDraft(draft.id);
      onDone();
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: draft.boat_id,
          started_at: buildIso(date, startTime),
          ended_at: endTime ? buildIso(date, endTime) : null,
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

  if (saved) {
    return (
      <div className="mx-3 mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✓ Trip saved
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none";

  return (
    <div className="mx-3 mt-3 rounded-2xl border border-ocean-200 bg-ocean-50 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        <div className="flex-shrink-0 mt-0.5 rounded-full bg-ocean-100 p-1.5">
          <Mail size={14} className="text-ocean-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-800">Trip email received</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {draft.email_subject ?? "No subject"}
          </div>
          {(draft.parsed_notes || draft.parsed_started_at || draft.parsed_engine_hours) && (
            <div className="mt-2 space-y-0.5">
              {draft.parsed_notes && (
                <div className="text-sm text-slate-700 font-medium truncate">{draft.parsed_notes}</div>
              )}
              <div className="flex items-center gap-3">
                {draft.parsed_started_at && (
                  <div className="text-xs text-ocean-600">{formatDate(draft.parsed_started_at)}</div>
                )}
                {draft.parsed_engine_hours != null && (
                  <div className="text-xs text-slate-400">{draft.parsed_engine_hours}h engine</div>
                )}
                {draft.parsed_fuel_litres != null && (
                  <div className="text-xs text-slate-400">{draft.parsed_fuel_litres}L fuel</div>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-ocean-100 hover:text-slate-600 transition"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Expandable form */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-ocean-100 pt-3">
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
      )}

      {/* CTA row */}
      <div className="px-4 pb-3.5 flex gap-2">
        <button
          type="button"
          onClick={expanded ? handleSave : () => setExpanded(true)}
          disabled={saving}
          className="flex items-center gap-1.5 flex-1 justify-center rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
        >
          <Anchor size={14} />
          {saving ? "Saving…" : expanded ? "Save trip" : "Review & save trip"}
        </button>
        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-xl border border-ocean-200 px-3 py-2.5 text-slate-500 hover:bg-ocean-100 transition"
            aria-label="Collapse"
          >
            <ChevronUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
