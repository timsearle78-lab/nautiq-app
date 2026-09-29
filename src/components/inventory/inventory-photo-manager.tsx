"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

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
        Photos <span className="text-slate-400 font-normal">({urls.length}/{MAX_PHOTOS})</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {/* Thumbnails */}
        {urls.map((url, i) => (
          <div
            key={url}
            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer"
            onClick={() => setLightboxIdx(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(url); }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              aria-label="Remove photo"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* Add buttons */}
        {canAdd && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-ocean-400 hover:text-ocean-500 hover:bg-ocean-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
              title="Upload from device"
            >
              <ImagePlus size={18} />
              <span className="text-[10px] font-medium leading-tight text-center">Upload</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-ocean-400 hover:text-ocean-500 hover:bg-ocean-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
              title="Take a photo"
            >
              <Camera size={18} />
              <span className="text-[10px] font-medium leading-tight text-center">Camera</span>
            </button>
          </div>
        )}

        {uploading && (
          <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

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
