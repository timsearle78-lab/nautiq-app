"use client";

import { useActionState, useState, useRef } from "react";
import { X, Wrench, Camera, ImagePlus, Trash2 } from "lucide-react";
import SaveSuccessSheet from "@/components/ui/save-success-sheet";
import NautiqSpinner from "@/components/ui/nautiq-spinner";
import { logMaintenance } from "@/app/(app)/components/[id]/actions";
import VoiceTextarea from "@/components/ui/voice-textarea";
import { todayLocal } from "@/lib/format-date";

type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };
type ComponentOption = { id: string; name: string };

type Prefill = {
  workDone?: string;
  performedAt?: string;
  engineHours?: number;
  vendor?: string;
  notes?: string;
};

interface Props {
  boatId: string;
  /** Lock to a specific component — hides the picker (use from component detail page). */
  componentId: string | null;
  /** Pre-select a component but still show the picker so the user can change it. */
  defaultComponentId?: string | null;
  components?: ComponentOption[];
  inventoryOptions: InventoryOption[];
  onClose: () => void;
  onSaved: () => void;
  prefill?: Prefill;
}

const MAX_PHOTOS = 3;

export default function LogMaintenanceSheet({
  boatId,
  componentId: initialComponentId,
  defaultComponentId,
  components = [],
  inventoryOptions,
  onClose,
  onSaved,
  prefill,
}: Props) {
  const [selectedComponentId, setSelectedComponentId] = useState(initialComponentId ?? defaultComponentId ?? "");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string; eventId?: string }, fd: FormData) => {
      const result = await logMaintenance(prev, fd);
      if (result.success && result.eventId && photos.length > 0) {
        setUploadingPhotos(true);
        try {
          const photoFormData = new FormData();
          photos.forEach((f) => photoFormData.append("photos", f));
          const photoRes = await fetch(`/api/maintenance-events/${result.eventId}/photos`, {
            method: "POST",
            body: photoFormData,
          });
          if (!photoRes.ok) {
            const detail = await photoRes.json().catch(() => ({}));
            console.error("Photo upload failed:", photoRes.status, detail);
          }
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
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotos((p) => [...p, ...toAdd]);
    setPreviews((p) => [...p, ...newPreviews]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((p) => p.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  const effectiveComponentId = initialComponentId !== null ? initialComponentId : selectedComponentId;
  const isBusy = pending || uploadingPhotos;

  if (saved) return <SaveSuccessSheet message="Maintenance logged!" />;

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

  return (
    <>
      {isBusy && <NautiqSpinner overlay />}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-ocean-600" />
            <h2 className="text-base font-semibold text-slate-900">Log Maintenance</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-4 pb-8 space-y-4">
          <input type="hidden" name="boat_id" value={boatId} />
          <input type="hidden" name="component_id" value={effectiveComponentId} />

          {/* Component picker — only shown when not pre-set */}
          {!initialComponentId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Component <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedComponentId}
                onChange={(e) => setSelectedComponentId(e.target.value)}
                required
                className="select-field"
              >
                <option value="">Select a component…</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                name="performed_at"
                type="date"
                defaultValue={prefill?.performedAt ?? todayLocal()}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine hours</label>
              <input
                name="engine_hours_at_service"
                type="number"
                min="0"
                step="0.1"
                placeholder="Optional"
                defaultValue={prefill?.engineHours ?? ""}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Work done <span className="text-red-500">*</span>
              </label>
              <input
                name="work_done"
                required
                placeholder="e.g. Replaced impeller"
                defaultValue={prefill?.workDone ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
              <input name="vendor" placeholder="Optional" defaultValue={prefill?.vendor ?? ""} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`${inputCls} pl-6`}
                />
              </div>
            </div>
            <div />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <VoiceTextarea value={notes} onChange={setNotes} placeholder="Any additional details…" rows={3} />
            <input type="hidden" name="notes" value={notes} />
          </div>

          {/* Photo attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Photos <span className="text-xs font-normal text-slate-400">up to {MAX_PHOTOS}</span>
            </label>

            {/* Thumbnails */}
            {previews.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
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

            {/* Add photo buttons */}
            {photos.length < MAX_PHOTOS && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600"
                >
                  <Camera size={15} />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600"
                >
                  <ImagePlus size={15} />
                  Choose
                </button>
                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            )}
          </div>

          {/* Consume spare */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Item used during service</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item</label>
                <select name="inventory_item_id" defaultValue="" className="select-field">
                  <option value="">None</option>
                  {inventoryOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity}{item.unit ? ` ${item.unit}` : ""})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Qty used</label>
                <input
                  name="inventory_quantity_used"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue="1"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={isBusy || (!initialComponentId && !selectedComponentId)}
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0B7EB8" }}
          >
            {uploadingPhotos ? "Uploading photos…" : pending ? "Saving…" : "Save maintenance record"}
          </button>
        </form>
      </div>
    </>
  );
}
