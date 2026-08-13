"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { updateMaintenanceEvent } from "@/app/(app)/components/[id]/actions";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

interface Props {
  eventId: string;
  componentId: string;
  performedAt: string | null;
  workDone: string | null;
  notes: string | null;
  vendor: string | null;
  engineHoursAtService: number | null;
  cost: number | null;
}

export function EditMaintenanceButton({
  eventId,
  componentId,
  performedAt,
  workDone,
  notes,
  vendor,
  engineHoursAtService,
  cost,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string }, fd: FormData) => {
      const result = await updateMaintenanceEvent(prev, fd);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {}
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-ocean-50 hover:text-ocean-600"
        aria-label="Edit maintenance record"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-slate-900">Edit Maintenance Record</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="p-4 pb-8 space-y-4">
              <input type="hidden" name="event_id" value={eventId} />
              <input type="hidden" name="component_id" value={componentId} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                  <input name="performed_at" type="date" defaultValue={performedAt?.slice(0, 10) ?? ""} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine hours</label>
                  <input name="engine_hours_at_service" type="number" min="0" step="0.1" defaultValue={engineHoursAtService ?? ""} placeholder="Optional" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Work done <span className="text-red-500">*</span></label>
                <input name="work_done" type="text" defaultValue={workDone ?? ""} required className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
                  <input name="vendor" type="text" defaultValue={vendor ?? ""} placeholder="Optional" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input name="cost" type="number" min="0" step="0.01" defaultValue={cost ?? ""} placeholder="0.00" className={`${inputCls} pl-6`} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea name="notes" rows={3} defaultValue={notes ?? ""} placeholder="Optional" className={`${inputCls} resize-none`} />
              </div>

              {state.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
