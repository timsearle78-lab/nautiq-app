"use client";

import { useActionState } from "react";
import { addBoat } from "@/app/(app)/settings/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

const BOAT_TYPES = ["Motorboat", "Keeler Yacht", "Trailer Yacht", "Catamaran", "RIB", "Other"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function AddBoatForm() {
  const [state, action, pending] = useActionState(addBoat, {});

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required className={inputCls} placeholder="My second boat" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
          <select name="type" className={inputCls}>
            <option value="">Select type</option>
            {BOAT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state.success && <SaveSuccessBanner message={state.success} />}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl btn-primary px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add boat"}
      </button>
    </form>
  );
}
