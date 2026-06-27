"use client";

import { useRef } from "react";
import { X, ScanLine, PackagePlus, PackageMinus, Plus, RotateCcw } from "lucide-react";
import TripTimerButton from "@/components/nav/trip-timer-button";

interface ChatActionsSheetProps {
  boatId: string;
  hasMessages: boolean;
  scanningInventory: boolean;
  onClose: () => void;
  onScanItem: () => void;
  onRestockItem: () => void;
  onUsedItem: () => void;
  onLogMaintenance: () => void;
  onLogTrip: () => void;
  onResetChat: () => void;
}

export default function ChatActionsSheet({
  boatId,
  hasMessages,
  scanningInventory,
  onClose,
  onScanItem,
  onRestockItem,
  onUsedItem,
  onLogMaintenance,
  onLogTrip,
  onResetChat,
}: ChatActionsSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function action(fn: () => void) {
    return () => { fn(); onClose(); };
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
    >
      <div className="bg-white rounded-t-2xl shadow-xl pb-safe">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Quick actions</p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {/* Trip timer — full-width row */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Trip timer</span>
            <TripTimerButton boatId={boatId} />
          </div>

          {/* Two-column grid for the rest */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={action(onLogTrip)}
              className="flex items-center gap-2 rounded-xl btn-primary px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Log Trip
            </button>

            <button
              onClick={action(onLogMaintenance)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus size={16} />
              Log Maintenance
            </button>

            <button
              onClick={action(onScanItem)}
              disabled={scanningInventory}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <ScanLine size={16} />
              {scanningInventory ? "Scanning…" : "Scan item"}
            </button>

            <button
              onClick={action(onRestockItem)}
              className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 transition"
            >
              <PackagePlus size={16} />
              Restock item
            </button>

            <button
              onClick={action(onUsedItem)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <PackageMinus size={16} />
              Used item
            </button>

            {hasMessages && (
              <button
                onClick={action(onResetChat)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
              >
                <RotateCcw size={16} />
                New chat
              </button>
            )}
          </div>
        </div>

        {/* Bottom safe area padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
