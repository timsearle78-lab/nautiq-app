"use client";

import { useActionState } from "react";
import { updateBoat } from "@/app/(app)/settings/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

const BOAT_TYPES = ["Motorboat", "Sailboat", "Catamaran", "Yacht", "RIB", "Other"];
const PROPULSION_TYPES = ["Inboard diesel", "Inboard petrol", "Outboard", "Sail", "Sail + auxiliary", "Electric", "Hybrid"];
const HULL_DESIGNS = ["Monohull", "Catamaran", "Trimaran", "Pontoon", "Semi-displacement", "Planing", "Displacement"];
const HULL_MATERIALS = ["Fibreglass (GRP)", "Aluminium", "Steel", "Wood", "Carbon fibre", "Ferro-cement", "Inflatable (Hypalon)", "Inflatable (PVC)"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

type Props = {
  boatId: string;
  name: string;
  type: string | null;
  propulsion?: string | null;
  hull_design?: string | null;
  hull_material?: string | null;
  length_m?: number | null;
  beam_m?: number | null;
  draft_m?: number | null;
};

export function EditBoatForm({ boatId, name, type, propulsion, hull_design, hull_material, length_m, beam_m, draft_m }: Props) {
  const [state, action, pending] = useActionState(updateBoat, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="boat_id" value={boatId} />

      {/* Basic info */}
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

      {/* Propulsion & hull */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Propulsion</label>
          <select name="propulsion" defaultValue={propulsion ?? ""} className={inputCls}>
            <option value="">Select propulsion</option>
            {PROPULSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Hull design</label>
          <select name="hull_design" defaultValue={hull_design ?? ""} className={inputCls}>
            <option value="">Select hull design</option>
            {HULL_DESIGNS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Hull material</label>
        <select name="hull_material" defaultValue={hull_material ?? ""} className={inputCls}>
          <option value="">Select hull material</option>
          {HULL_MATERIALS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Dimensions */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Dimensions (metres)</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Length (LOA)</label>
            <input
              name="length_m"
              type="number"
              step="0.1"
              min="0"
              defaultValue={length_m ?? ""}
              placeholder="e.g. 10.5"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Beam</label>
            <input
              name="beam_m"
              type="number"
              step="0.1"
              min="0"
              defaultValue={beam_m ?? ""}
              placeholder="e.g. 3.2"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Draft</label>
            <input
              name="draft_m"
              type="number"
              step="0.1"
              min="0"
              defaultValue={draft_m ?? ""}
              placeholder="e.g. 1.8"
              className={inputCls}
            />
          </div>
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
