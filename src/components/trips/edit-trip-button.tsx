"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Fuel, Camera, ImagePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

const MAX_PHOTOS = 3;

interface Props {
  tripId: string;
  boatId: string;
  startedAt: string | null;
  endedAt: string | null;
  engineHoursDelta: number | null;
  fuelAddedLitres: number | null;
  notes: string | null;
  photoUrls?: string[];
}

type FuelPreview = { rate: number; fuelItem: { name: string; quantity: number; unit: string | null } | null } | null;

export function EditTripButton({ tripId, boatId, startedAt, endedAt, engineHoursDelta, fuelAddedLitres, notes, photoUrls = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [engineHoursVal, setEngineHoursVal] = useState(engineHoursDelta?.toString() ?? "");
  const [fuelVal, setFuelVal] = useState(fuelAddedLitres?.toString() ?? "");
  const [fuelPreview, setFuelPreview] = useState<FuelPreview>(null);
  const [photos, setPhotos] = useState<string[]>(photoUrls);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setPhotoError(null);
    setPhotoUploading(true);
    const formData = new FormData();
    Array.from(files).slice(0, MAX_PHOTOS - photos.length).forEach((f) => formData.append("photos", f));
    try {
      const res = await fetch(`/api/trips/${tripId}/photos`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) setPhotoError(data.error ?? "Upload failed");
      else setPhotos((prev) => [...prev, ...(data.urls as string[])]);
    } catch { setPhotoError("Upload failed — please try again"); }
    finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function handlePhotoDelete(url: string) {
    setPhotoError(null);
    const res = await fetch(`/api/trips/${tripId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((u) => u !== url));
      if (lightboxIdx !== null) setLightboxIdx(null);
    } else {
      const data = await res.json();
      setPhotoError(data.error ?? "Delete failed");
    }
  }

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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fuel used (L)</label>
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

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Photos <span className="text-xs font-normal text-slate-400">up to {MAX_PHOTOS}</span>
                </label>
                {photos.length > 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {photos.map((url, i) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition"
                          onClick={() => setLightboxIdx(i)}
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete(url)}
                          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < MAX_PHOTOS && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600 disabled:opacity-50"
                    >
                      <Camera size={15} /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600 disabled:opacity-50"
                    >
                      <ImagePlus size={15} /> Choose
                    </button>
                    {photoUploading && (
                      <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400">
                        <div className="w-4 h-4 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
                        Uploading…
                      </div>
                    )}
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoFiles(e.target.files)} />
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoFiles(e.target.files)} />
                {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
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

      {/* Photo lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }} className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length); }} className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % photos.length); }} className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[lightboxIdx]} alt="" className="max-h-[85dvh] max-w-[92vw] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={(e) => { e.stopPropagation(); handlePhotoDelete(photos[lightboxIdx]); }} className="absolute bottom-8 right-4 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
            Remove
          </button>
          {photos.length > 1 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }} className={`h-1.5 rounded-full transition-all ${i === lightboxIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
