"use client";

import { useActionState, useEffect } from "react";
import { X, Anchor } from "lucide-react";
import { logCheckin, type CheckinActionState } from "@/app/(app)/checkins/actions";

interface LogCheckinSheetProps {
  boatId: string;
  onClose: () => void;
  onSaved: () => void;
}

const initial: CheckinActionState = {};

export default function LogCheckinSheet({ boatId, onClose, onSaved }: LogCheckinSheetProps) {
  const [state, action, pending] = useActionState(logCheckin, initial);

  useEffect(() => {
    if (state.success) onSaved();
  }, [state.success, onSaved]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1040px] z-50 bg-white rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Anchor size={18} className="text-ocean-600" />
            <h2 className="text-base font-semibold text-slate-800">Log boat visit</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form action={action} className="px-5 py-5 space-y-4">
          <input type="hidden" name="boat_id" value={boatId} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit date</label>
            <input
              type="date"
              name="checked_at"
              defaultValue={today}
              max={today}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              name="notes"
              rows={3}
              placeholder="What did you check or do on this visit?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl btn-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save visit"}
          </button>
        </form>
      </div>
    </>
  );
}
