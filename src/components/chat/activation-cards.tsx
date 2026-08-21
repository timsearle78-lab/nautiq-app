"use client";

import { useState } from "react";
import { MapPin, Package, X, ChevronRight } from "lucide-react";
import Link from "next/link";

function DismissibleCard({ id, children }: { id: string; children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(`nautiq_card_${id}`) === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(`nautiq_card_${id}`, "1"); } catch {}
    setDismissed(true);
  }

  return (
    <div className="relative mx-4 mt-4">
      {children}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NoTripsCard({ boatId }: { boatId: string }) {
  return (
    <DismissibleCard id="no-trips">
      <div className="rounded-2xl border border-ocean-200 bg-ocean-50 overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#22A9DD,#0B7EB8)" }}>
            <MapPin size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Log your first trip</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Track engine hours and fuel used every time you head out. NautIQ uses this to predict when components are due for service.
            </p>
          </div>
        </div>
        <div className="border-t border-ocean-200 px-4 py-2.5 flex items-center gap-3">
          <Link
            href="/trips"
            className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-full btn-primary px-3 py-1.5"
          >
            Log a trip
            <ChevronRight size={12} />
          </Link>
          <span className="text-xs text-slate-400">or tap the mic and say "I just went for a sail"</span>
        </div>
      </div>
    </DismissibleCard>
  );
}

export function NoInventoryCard() {
  return (
    <DismissibleCard id="no-inventory">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#34D399,#059669)" }}>
            <Package size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Add your first spare parts</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Keep track of what's on board — oil filters, impellers, flares, first aid kit. NautIQ alerts you when stocks run low or items expire.
            </p>
          </div>
        </div>
        <div className="border-t border-emerald-200 px-4 py-2.5 flex items-center gap-3">
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-full btn-primary px-3 py-1.5"
          >
            Add spares
            <ChevronRight size={12} />
          </Link>
          <span className="text-xs text-slate-400">or scan a product with the camera</span>
        </div>
      </div>
    </DismissibleCard>
  );
}
