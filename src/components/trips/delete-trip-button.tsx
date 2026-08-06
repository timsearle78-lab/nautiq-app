"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTrip } from "@/app/(app)/trips/actions";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      await deleteTrip(tripId);
    } catch {
      setPending(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-slate-500">Delete?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
      aria-label="Delete trip"
    >
      <Trash2 size={14} />
    </button>
  );
}
