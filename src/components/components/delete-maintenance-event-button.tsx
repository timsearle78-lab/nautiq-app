"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteMaintenanceEvent } from "@/app/(app)/components/[id]/actions";

export function DeleteMaintenanceEventButton({
  eventId,
  componentId,
}: {
  eventId: string;
  componentId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      await deleteMaintenanceEvent(eventId, componentId);
      router.refresh();
    } catch {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setConfirming((v) => !v)}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
        aria-label="Delete maintenance record"
      >
        <Trash2 size={14} />
      </button>

      {confirming && (
        <div className="absolute right-0 top-full z-10 mt-1 w-28 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="mb-2 text-center text-xs text-slate-500">Delete?</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 rounded-lg bg-red-600 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-slate-200 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
