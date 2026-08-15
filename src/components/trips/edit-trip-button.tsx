"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Fuel } from "lucide-react";
import { updateTrip } from "@/app/(app)/trips/actions";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

function toLocalDate(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toLocalTime(iso: string | null) {
  if (!iso) return "";
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

function buildIso(date: string, time: string) {
  if (!date) return null;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

interface Props {
  tripId: string;
  boatId: string;
  startedAt: string | null;
  endedAt: string | null;
  engineHoursDelta: number | null;
  fuelAddedLitres: number | null;
  notes: string | null;
}

type FuelPreview = { rate: number; fuelItem: { name: string; quantity: number; unit: string | null } | null } | null;

export function EditTripButton({ tripId, boatId, startedAt, endedAt, engineHoursDelta, fuelAddedLitres, notes }: Props) {
  const [open, setOpen] = useState(false);
  const [engineHoursVal, setEngineHoursVal] = useState(engineHoursDelta?.toString() ?? "");
  const [fuelVal, setFuelVal] = useState(fuelAddedLitres?.toString() ?? "");
  const [fuelPreview, setFuelPreview] = useState<FuelPreview>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/boats/fuel-preview?boatId=${boatId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled && data?.rate) setFuelPreview(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [boatId, open]);

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string }, fd: FormData) => {
      // Build ISO timestamps from date+time fields before submitting
      const startDate = String(fd.get("start_date") ?? "");
      const startTime = String(fd.get("start_time") ?? "");
      const endDate = String(fd.get("end_date") ?? "");
      const endTime = String(fd.get("end_time") ?? "");
      fd.set("started_at", buildIso(startDate, startTime) ?? "");
      fd.set("ended_at", buildIso(endDate, endTime) ?? "");
      const result = await updateTrip(prev, fd);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {}
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-ocean-50 hover:text-ocean-600"
        aria-label="Edit trip"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-slate-900">Edit Trip</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="p-4 pb-8 space-y-4">
              <input type="hidden" name="trip_id" value={tripId} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start</label>
                <div className="grid grid-cols-2 gap-2">
                  <input name="start_date" type="date" defaultValue={toLocalDate(startedAt)} className={inputCls} />
                  <input name="start_time" type="time" defaultValue={toLocalTime(startedAt)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End</label>
                <div className="grid grid-cols-2 gap-2">
                  <input name="end_date" type="date" defaultValue={toLocalDate(endedAt)} className={inputCls} />
                  <input name="end_time" type="time" defaultValue={toLocalTime(endedAt)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine hours</label>
                  <input
                    name="engine_hours_delta"
                    type="number"
                    min="0"
                    step="0.1"
                    value={engineHoursVal}
                    onChange={(e) => setEngineHoursVal(e.target.value)}
                    placeholder="Optional"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fuel added (L)</label>
                  <input
                    name="fuel_added_litres"
                    type="number"
                    min="0"
                    step="0.1"
                    value={fuelVal}
                    onChange={(e) => setFuelVal(e.target.value)}
                    placeholder="Optional"
                    className={inputCls}
                  />
                </div>
              </div>
              {(() => {
                const hours = parseFloat(engineHoursVal);
                const fp = fuelPreview;
                if (!fp || !hours || hours <= 0 || fuelVal) return null;
                const estimated = Math.round(hours * fp.rate * 10) / 10;
                const itemName = fp.fuelItem?.name ?? "fuel";
                const currentStock = fp.fuelItem ? fp.fuelItem.quantity : null;
                const unit = fp.fuelItem?.unit ?? "L";
                return (
                  <div className="flex items-start gap-2 rounded-xl border border-ocean-200 bg-ocean-50 px-3 py-2.5">
                    <Fuel size={15} className="text-ocean-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-ocean-800 leading-snug">
                      <span className="font-semibold">~{estimated} L</span> of <span className="font-medium">{itemName}</span> will be estimated and deducted from inventory
                      {currentStock != null && (
                        <span className="text-ocean-600"> (currently {currentStock} {unit})</span>
                      )}
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea name="notes" rows={3} defaultValue={notes ?? ""} placeholder="Optional" className={`${inputCls} resize-none`} />
              </div>

              {state.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
