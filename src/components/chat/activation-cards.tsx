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
        className="absolute top-3 right-3 p-1 rounded-full transition-opacity hover:opacity-70"
        style={{ color: "#8FB3CC" }}
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
      <div className="card overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5"
            style={{ background: "#0B7EB8" }}
          >
            <MapPin size={14} color="#FFFFFF" />
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}>Log your first trip</p>
            <p style={{ fontSize: 13, color: "#8FB3CC", marginTop: 2, lineHeight: 1.5 }}>
              Track engine hours and fuel every time you head out — NautIQ uses this to predict when components are due for service.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1.5px solid #DBE3EA" }}>
          <Link
            href="/trips"
            className="flex items-center gap-1.5 btn-primary px-4 py-2"
            style={{ fontSize: 13, minHeight: "auto", borderRadius: 8 }}
          >
            Log a trip
            <ChevronRight size={12} />
          </Link>
          <span style={{ fontSize: 12, color: "#8FB3CC" }}>or say "I just went for a sail"</span>
        </div>
      </div>
    </DismissibleCard>
  );
}

export function NoInventoryCard() {
  return (
    <DismissibleCard id="no-inventory">
      <div className="card overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5"
            style={{ background: "#0E7A3D" }}
          >
            <Package size={14} color="#FFFFFF" />
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}>Add your first spare parts</p>
            <p style={{ fontSize: 13, color: "#8FB3CC", marginTop: 2, lineHeight: 1.5 }}>
              Keep track of what&apos;s on board — oil filters, impellers, flares, first aid kit. NautIQ alerts you when stocks run low or items expire.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1.5px solid #DBE3EA" }}>
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 btn-primary px-4 py-2"
            style={{ fontSize: 13, minHeight: "auto", borderRadius: 8 }}
          >
            Add spares
            <ChevronRight size={12} />
          </Link>
          <span style={{ fontSize: 12, color: "#8FB3CC" }}>or scan a product with the camera</span>
        </div>
      </div>
    </DismissibleCard>
  );
}
