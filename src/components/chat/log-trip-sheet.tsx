"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface LogTripSheetProps {
  boatId: string;
  prefillEngineHours?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

function todayLocal() {
  return new Date().toISOString().slice(0, 10);
}

function buildIso(date: string, time: string) {
  if (!date) return null;
  if (!time) return `${date}T00:00:00`;
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function LogTripSheet({
  boatId,
  prefillEngineHours,
  onClose,
  onSaved,
}: LogTripSheetProps) {
  const [date, setDate] = useState(todayLocal());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [engineHours, setEngineHours] = useState(
    prefillEngineHours?.toString() ?? ""
  );
  const [fuelLitres, setFuelLitres] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!date) {
      setError("Enter a date for this trip");
      return;
    }
    const hours = parseFloat(engineHours);
    if (!hours || hours <= 0) {
      setError("Enter engine hours for this trip");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          boatId,
          started_at: buildIso(date, startTime),
          ended_at: buildIso(date, endTime),
          engine_hours_delta: hours,
          fuel_added_litres: fuelLitres ? parseFloat(fuelLitres) : null,
          notes: notes || null,
          source: "manual",
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => onSaved(), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Server error ${res.status}. Try again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/30" />
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-900">Trip saved!</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Log Trip</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {prefillEngineHours != null && (
            <div className="rounded-lg bg-ocean-50 border border-ocean-200 px-3 py-2.5 text-sm text-ocean-700">
              Engine panel read: <strong>{prefillEngineHours}h total</strong> — enter hours for <em>this trip</em> below.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Departure</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Return</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Engine hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={engineHours}
              onChange={(e) => setEngineHours(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Fuel added (litres)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={fuelLitres}
              onChange={(e) => setFuelLitres(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Where you went, any issues…"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="px-4 pb-6 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-ocean-600 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Trip"}
          </button>
        </div>
      </div>
    </>
  );
}
