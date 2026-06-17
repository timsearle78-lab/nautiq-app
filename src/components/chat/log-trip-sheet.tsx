"use client";

import { useState } from "react";
import { X, Mic, Camera } from "lucide-react";

interface LogTripSheetProps {
  boatId: string;
  prefillEngineHours?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function LogTripSheet({
  boatId,
  prefillEngineHours,
  onClose,
  onSaved,
}: LogTripSheetProps) {
  const [engineHours, setEngineHours] = useState(
    prefillEngineHours?.toString() ?? ""
  );
  const [notes, setNotes] = useState("");
  const [fuelLitres, setFuelLitres] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
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
        body: JSON.stringify({
          boatId,
          engine_hours_delta: hours,
          fuel_added_litres: fuelLitres ? parseFloat(fuelLitres) : null,
          notes: notes || null,
          source: "manual",
        }),
      });

      if (res.ok) {
        onSaved();
      } else {
        setError("Failed to save trip. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
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
              autoFocus
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
