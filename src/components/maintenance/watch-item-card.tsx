"use client";

import { useActionState, useState } from "react";
import { Eye, CheckCircle, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { deleteWatchItem } from "@/app/(app)/maintenance/watch-items/actions";

type ComponentOption = { id: string; name: string };
type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

export type WatchItem = {
  id: string;
  title: string;
  notes: string | null;
  photo_urls: string[] | null;
  component_id: string | null;
  component_name: string | null;
  created_at: string;
};

interface Props {
  item: WatchItem;
  boatId: string;
  components: ComponentOption[];
  inventoryOptions: InventoryOption[];
  onResolved: () => void;
  onDeleted: () => void;
  onMarkDone: (item: WatchItem) => void;
}

function daysAgo(isoDate: string) {
  const d = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

export default function WatchItemCard({ item, boatId, onDeleted, onMarkDone }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [, deleteAction, deletesPending] = useActionState(
    async (prev: { error?: string }, fd: FormData) => {
      const result = await deleteWatchItem(prev, fd);
      if (result.success) onDeleted();
      return result;
    },
    {}
  );

  const photos = item.photo_urls?.filter(Boolean) ?? [];

  function prevPhoto() {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    if (lightboxIdx === null) return;
    setLightboxIdx((lightboxIdx + 1) % photos.length);
  }

  return (
    <>
      <div className="rounded-[18px] overflow-hidden" style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA" }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Eye size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 leading-snug" style={{ fontSize: 15 }}>{item.title}</p>
              {item.component_name && (
                <p className="text-xs text-slate-500 mt-0.5">{item.component_name}</p>
              )}
              {item.notes && (
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.notes}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{daysAgo(item.created_at)}</span>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 flex-wrap">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="relative rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                  style={{ width: 72, height: 72 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMarkDone(item)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition btn-primary"
          >
            <CheckCircle size={14} />
            Mark done
          </button>

          {confirmDelete ? (
            <form action={deleteAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                disabled={deletesPending}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {deletesPending ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={18} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIdx]}
            alt=""
            className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              >
                <ChevronRight size={22} />
              </button>
              <div className="absolute bottom-6 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                    className="h-2 rounded-full transition-all"
                    style={{ width: i === lightboxIdx ? 20 : 8, background: i === lightboxIdx ? "#FFFFFF" : "rgba(255,255,255,0.4)" }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
