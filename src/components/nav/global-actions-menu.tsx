"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ScanLine, PackagePlus, PackageMinus, Plus, RotateCcw } from "lucide-react";
import TripTimerButton from "@/components/nav/trip-timer-button";
import LogTripSheet from "@/components/chat/log-trip-sheet";
import LogMaintenanceSheet from "@/components/components/log-maintenance-sheet";

interface GlobalActionsMenuProps {
  boatId: string;
}

type ComponentOption = { id: string; name: string };
type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };

export default function GlobalActionsMenu({ boatId }: GlobalActionsMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname === "/" || pathname === "/chat";

  const [open, setOpen] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [inventory, setInventory] = useState<InventoryOption[]>([]);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Listen for the hamburger trigger from AppHeader
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("nautiq:open-chat-actions", handler);
    return () => window.removeEventListener("nautiq:open-chat-actions", handler);
  }, []);

  // Lazy-fetch components + inventory when sheet opens (needed for Log Maintenance)
  useEffect(() => {
    if (!open || components.length > 0) return;
    fetch(`/api/boat-data?boatId=${boatId}`)
      .then((r) => r.json())
      .then((d) => {
        setComponents(d.components ?? []);
        setInventory(d.inventory ?? []);
      })
      .catch(() => {});
  }, [open, boatId, components.length]);

  function close() { setOpen(false); }

  function act(fn: () => void) {
    return () => { fn(); close(); };
  }

  function goChat(action: string) {
    close();
    router.push(`/?action=${action}`);
  }

  if (!open && !showTrip && !showMaintenance) return null;

  return (
    <>
      {open && (
        <div
          ref={backdropRef}
          onClick={(e) => { if (e.target === backdropRef.current) close(); }}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
        >
          <div className="bg-white rounded-t-2xl shadow-xl pb-safe">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Quick actions</p>
              <button
                onClick={close}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-3 space-y-2">
              {/* Trip timer */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Trip timer</span>
                <TripTimerButton boatId={boatId} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={act(() => setShowTrip(true))}
                  className="flex items-center gap-2 rounded-xl btn-primary px-4 py-3 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Log Trip
                </button>

                <button
                  onClick={act(() => setShowMaintenance(true))}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Plus size={16} />
                  Log Maintenance
                </button>

                <button
                  onClick={() => goChat("scan")}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <ScanLine size={16} />
                  Scan item
                </button>

                <button
                  onClick={() => goChat("restock")}
                  className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 transition"
                >
                  <PackagePlus size={16} />
                  Restock item
                </button>

                <button
                  onClick={() => goChat("used")}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <PackageMinus size={16} />
                  Used item
                </button>

                {isChat && (
                  <button
                    onClick={() => { close(); window.dispatchEvent(new CustomEvent("nautiq:reset-chat")); }}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
                  >
                    <RotateCcw size={16} />
                    New chat
                  </button>
                )}
              </div>
            </div>

            <div className="h-4" />
          </div>
        </div>
      )}

      {showTrip && (
        <LogTripSheet
          boatId={boatId}
          onClose={() => setShowTrip(false)}
          onSaved={() => { setShowTrip(false); router.refresh(); }}
        />
      )}

      {showMaintenance && (
        <LogMaintenanceSheet
          boatId={boatId}
          componentId={null}
          components={components}
          inventoryOptions={inventory}
          onClose={() => setShowMaintenance(false)}
          onSaved={() => { setShowMaintenance(false); router.refresh(); }}
        />
      )}
    </>
  );
}
