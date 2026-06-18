"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = { boatId: string; imageUrl: string | null };

export function BoatImageUpload({ boatId, imageUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch(`/api/boats/${boatId}/image`, { method: "POST", body: fd });
    const json = await res.json();

    setUploading(false);

    if (!res.ok) {
      setError(json.error ?? "Upload failed");
      return;
    }

    setPreview(json.imageUrl);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-16 w-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden hover:border-ocean-400 transition flex items-center justify-center flex-shrink-0"
        title="Upload boat photo"
      >
        {preview ? (
          <Image src={preview} alt="Boat" fill className="object-cover" unoptimized />
        ) : (
          <span className="text-2xl select-none">⛵</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <svg className="h-5 w-5 animate-spin text-ocean-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP · shown in header</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
