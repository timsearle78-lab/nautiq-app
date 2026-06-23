"use client";

import { useActionState } from "react";
import { updateBoat } from "@/app/(app)/settings/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

const BOAT_TYPES = ["Motorboat", "Sailboat", "Catamaran", "Yacht", "RIB", "Other"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

type Props = { boatId: string; name: string; type: string | null };

export function EditBoatForm({ boatId, name, type }: Props) {
  const [state, action, pending] = useActionState(updateBoat, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="boat_id" value={boatId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required defaultValue={name} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
          <select name="type" defaultValue={type ?? ""} className={inputCls}>
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
        className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
