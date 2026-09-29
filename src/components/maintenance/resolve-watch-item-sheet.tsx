"use client";

import { useActionState, useState, useRef } from "react";
import { X, CheckCircle, Camera, ImagePlus, Trash2 } from "lucide-react";
import { resolveWatchItem } from "@/app/(app)/maintenance/watch-items/actions";
import NautiqSpinner from "@/components/ui/nautiq-spinner";
import SaveSuccessSheet from "@/components/ui/save-success-sheet";
import VoiceTextarea from "@/components/ui/voice-textarea";
import { todayLocal } from "@/lib/format-date";

type ComponentOption = { id: string; name: string };
type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

interface Props {
  boatId: string;
  watchItemId: string;
  watchItemTitle: string;
  watchItemComponentId: string | null;
  components: ComponentOption[];
  inventoryOptions: InventoryOption[];
  onClose: () => void;
  onSaved: () => void;
}

const MAX_PHOTOS = 3;

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export default function ResolveWatchItemSheet({
  boatId,
  watchItemId,
  watchItemTitle,
  watchItemComponentId,
  components,
  inventoryOptions,
  onClose,
  onSaved,
}: Props) {
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string; eventId?: string }, fd: FormData) => {
      const result = await resolveWatchItem(prev, fd);

      if (result.success && result.eventId && photos.length > 0) {
        setUploadingPhotos(true);
        try {
          const photoFormData = new FormData();
          photos.forEach((f) => photoFormData.append("photos", f));
          const res = await fetch(`/api/maintenance-events/${result.eventId}/photos`, {
            method: "POST",
            body: photoFormData,
          });
          if (!res.ok) console.error("Photo upload failed:", res.status);
        } catch (e) {
          console.error("Photo upload error:", e);
        } finally {
          setUploadingPhotos(false);
        }
      }

      if (result.success) {
        setSaved(true);
        setTimeout(onSaved, 1400);
      }
      return result;
    },
    {}
  );

  function addFiles(files: FileList | null) {
    if (!files) return;
    const toAdd = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    setPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))]);
    setPhotos((p) => [...p, ...toAdd]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i]);
    setPhotos((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  }

  const isBusy = pending || uploadingPhotos;
  if (saved) return <SaveSuccessSheet message="Maintenance logged!" />;

  return (
    <>
      {isBusy && <NautiqSpinner overlay />}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-slate-900">Log maintenance</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-4 pb-8 space-y-4">
          <input type="hidden" name="boat_id" value={boatId} />
          <input type="hidden" name="watch_item_id" value={watchItemId} />
          <input type="hidden" name="notes" value={notes} />

          {/* Resolving badge */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
            <CheckCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Resolving watch item</p>
              <p className="text-sm text-amber-700 mt-0.5">{watchItemTitle}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Component <span className="text-red-500">*</span>
            </label>
            <select
              name="component_id"
              defaultValue={watchItemComponentId ?? ""}
              required
              className="select-field"
            >
              <option value="" disabled>Select a component</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Work done <span className="text-red-500">*</span>
            </label>
            <input
              name="work_done"
              required
              defaultValue={watchItemTitle}
              placeholder="Describe what was done…"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              name="performed_at"
              defaultValue={todayLocal()}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine hours (optional)</label>
            <input
              type="number"
              name="engine_hours"
              placeholder="e.g. 1204.5"
              min="0"
              step="0.1"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
            <VoiceTextarea
              value={notes}
              onChange={setNotes}
              placeholder="Any extra detail…"
              rows={2}
            />
          </div>

          {/* Inventory used */}
          {inventoryOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Spare parts used <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <select name="inventory_item_id" defaultValue="" className="select-field">
                <option value="">None</option>
                {inventoryOptions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.quantity} {i.unit ?? "units"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Photos <span className="text-xs font-normal text-slate-400">up to {MAX_PHOTOS}</span>
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
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
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600"
                >
                  <Camera size={15} /> Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600"
                >
                  <ImagePlus size={15} /> Choose
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </div>
            )}
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50 btn-primary"
          >
            {uploadingPhotos ? "Uploading photos…" : pending ? "Saving…" : "Mark done & log maintenance"}
          </button>
        </form>
      </div>
    </>
  );
}
