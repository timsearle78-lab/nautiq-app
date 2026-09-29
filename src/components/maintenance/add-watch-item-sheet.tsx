"use client";

import { useActionState, useRef, useState } from "react";
import { X, Eye, Camera, ImagePlus, Trash2 } from "lucide-react";
import { createWatchItem } from "@/app/(app)/maintenance/watch-items/actions";
import NautiqSpinner from "@/components/ui/nautiq-spinner";
import SaveSuccessSheet from "@/components/ui/save-success-sheet";
import VoiceTextarea from "@/components/ui/voice-textarea";

type ComponentOption = { id: string; name: string };

interface Props {
  boatId: string;
  components: ComponentOption[];
  onClose: () => void;
  onSaved: () => void;
}

const MAX_PHOTOS = 3;

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export default function AddWatchItemSheet({ boatId, components, onClose, onSaved }: Props) {
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string; id?: string }, fd: FormData) => {
      const result = await createWatchItem(prev, fd);

      if (result.success && result.id && photos.length > 0) {
        setUploadingPhotos(true);
        try {
          const photoFormData = new FormData();
          photos.forEach((f) => photoFormData.append("photos", f));
          const res = await fetch(`/api/watch-items/${result.id}/photos`, {
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
  if (saved) return <SaveSuccessSheet message="Watch item added!" />;

  return (
    <>
      {isBusy && <NautiqSpinner overlay />}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">Add to watch list</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-4 pb-8 space-y-4">
          <input type="hidden" name="boat_id" value={boatId} />
          <input type="hidden" name="notes" value={notes} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              What needs attention? <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="e.g. Safety line lashing wearing thin"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Component (optional)</label>
            <select name="component_id" defaultValue="" className="select-field">
              <option value="">None — general observation</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0B7EB8" }}
          >
            {uploadingPhotos ? "Uploading photos…" : pending ? "Saving…" : "Add to watch list"}
          </button>
        </form>
      </div>
    </>
  );
}
