"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  urls: string[];
}

export function TripPhotos({ urls }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!urls.length) return null;

  const prev = () => setLightbox((i) => (i != null ? (i - 1 + urls.length) % urls.length : null));
  const next = () => setLightbox((i) => (i != null ? (i + 1) % urls.length : null));

  return (
    <>
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {urls.map((url, i) => (
          <button key={i} type="button" onClick={() => setLightbox(i)} className="focus:outline-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition"
            />
          </button>
        ))}
      </div>

      {lightbox != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X size={20} />
          </button>
          {urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[lightbox]}
            alt=""
            className="max-h-[85dvh] max-w-[92vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === lightbox ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
