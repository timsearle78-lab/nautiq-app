"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";

const MAX_PHOTOS = 3;

type Props = {
  itemId: string;
  initialUrls: string[];
};

export function InventoryPhotoManager({ itemId, initialUrls }: Props) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    const remaining = MAX_PHOTOS - urls.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((f) => formData.append("photos", f));

    try {
      const res = await fetch(`/api/inventory-items/${itemId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
      } else {
        setUrls((prev) => [...prev, ...(data.urls as string[])]);
      }
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  async function handleDelete(url: string) {
    setError(null);
    try {
      const res = await fetch(`/api/inventory-items/${itemId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Delete failed");
      } else {
        setUrls((prev) => prev.filter((u) => u !== url));
        if (lightboxIdx !== null) setLightboxIdx(null);
      }
    } catch {
      setError("Delete failed — please try again");
    }
  }

  const canAdd = urls.length < MAX_PHOTOS && !uploading;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Photos <span className="text-xs font-normal text-slate-400">up to {MAX_PHOTOS}</span>
      </label>

      {urls.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {urls.map((url, i) => (
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
                onClick={() => handleDelete(url)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600 disabled:opacity-50"
          >
            <Camera size={15} /> Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-ocean-300 hover:text-ocean-600 disabled:opacity-50"
          >
            <ImagePlus size={15} /> Choose
          </button>
          {uploading && (
            <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
              Uploading…
            </div>
          )}
        </div>
      )}
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[lightboxIdx]}
              alt={`Photo ${lightboxIdx + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            />

            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X size={16} />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDelete(urls[lightboxIdx])}
              className="absolute bottom-2 right-2 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Remove
            </button>

            {/* Prev/next */}
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + urls.length) % urls.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % urls.length)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {urls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIdx ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
