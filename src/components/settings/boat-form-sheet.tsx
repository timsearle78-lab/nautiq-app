"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Plus } from "lucide-react";
import { updateBoat, addBoat } from "@/app/(app)/settings/actions";
import { BoatImageUpload } from "./boat-image-upload";
import { BoatMembersPanel } from "./boat-members-panel";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

const BOAT_TYPES = ["Motorboat", "Keeler Yacht", "Trailer Yacht", "Catamaran", "RIB", "Other"];
const PROPULSION_TYPES = ["Inboard diesel", "Inboard petrol", "Outboard", "Sail", "Sail + auxiliary", "Electric", "Hybrid"];
const HULL_DESIGNS = ["Monohull", "Catamaran", "Trimaran", "Pontoon", "Semi-displacement", "Planing", "Displacement"];
const HULL_MATERIALS = ["Fibreglass (GRP)", "Aluminium", "Steel", "Wood", "Carbon fibre", "Ferro-cement", "Inflatable (Hypalon)", "Inflatable (PVC)"];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

type EditProps = {
  mode: "edit";
  boatId: string;
  boatName: string;
  isOwner: boolean;
  imageUrl: string | null;
  type: string | null;
  propulsion: string | null;
  hull_design: string | null;
  hull_material: string | null;
  length_m: number | null;
  beam_m: number | null;
  draft_m: number | null;
  description: string | null;
  fuel_consumption_lph: number | null;
  fuel_tank_litres: number | null;
};

type AddProps = { mode: "add" };

type Props = EditProps | AddProps;

export function BoatFormSheet(props: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [editState, editAction, editPending] = useActionState(updateBoat, {});
  const [addState, addAction, addPending] = useActionState(addBoat, {});

  const isEdit = props.mode === "edit";
  const state = isEdit ? editState : addState;
  const pending = isEdit ? editPending : addPending;

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white transition hover:bg-slate-50 hover:border-slate-300"
        >
          <Pencil size={13} />
          Edit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 btn-primary rounded-xl px-4 py-2.5 text-sm font-medium text-white transition"
        >
          <Plus size={15} />
          Add boat
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-slate-900">
                {isEdit ? `Edit — ${props.boatName}` : "Add a new boat"}
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 pb-8 space-y-6">
              {/* Photo upload (edit only) */}
              {isEdit && props.isOwner && (
                <BoatImageUpload boatId={props.boatId} imageUrl={props.imageUrl} />
              )}

              {/* Boat details form */}
              <form action={isEdit ? editAction : addAction} className="space-y-4">
                {isEdit && <input type="hidden" name="boat_id" value={props.boatId} />}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
                    <input
                      name="name"
                      required
                      defaultValue={isEdit ? props.boatName : ""}
                      placeholder={isEdit ? "" : "My boat"}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
                    <select name="type" defaultValue={isEdit ? (props.type ?? "") : ""} className="select-field">
                      <option value="">Select type</option>
                      {BOAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Propulsion</label>
                    <select name="propulsion" defaultValue={isEdit ? (props.propulsion ?? "") : ""} className="select-field">
                      <option value="">Select propulsion</option>
                      {PROPULSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Hull design</label>
                    <select name="hull_design" defaultValue={isEdit ? (props.hull_design ?? "") : ""} className="select-field">
                      <option value="">Select hull design</option>
                      {HULL_DESIGNS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Hull material</label>
                  <select name="hull_material" defaultValue={isEdit ? (props.hull_material ?? "") : ""} className="select-field">
                    <option value="">Select hull material</option>
                    {HULL_MATERIALS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Dimensions (metres)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Length (LOA)</label>
                      <input name="length_m" type="number" step="0.1" min="0" defaultValue={isEdit ? (props.length_m ?? "") : ""} placeholder="e.g. 10.5" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Beam</label>
                      <input name="beam_m" type="number" step="0.1" min="0" defaultValue={isEdit ? (props.beam_m ?? "") : ""} placeholder="e.g. 3.2" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Draft</label>
                      <input name="draft_m" type="number" step="0.1" min="0" defaultValue={isEdit ? (props.draft_m ?? "") : ""} placeholder="e.g. 1.8" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Consumption rate <span className="font-normal text-slate-400">(L/hr)</span>
                    </label>
                    <input name="fuel_consumption_lph" type="number" step="0.1" min="0" defaultValue={isEdit ? (props.fuel_consumption_lph ?? "") : ""} placeholder="e.g. 8.5" className={inputCls} />
                    <p className="mt-1 text-xs text-slate-400">Used to estimate fuel consumed per trip.</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Tank capacity <span className="font-normal text-slate-400">(litres)</span>
                    </label>
                    <input name="fuel_tank_litres" type="number" step="1" min="0" defaultValue={isEdit ? (props.fuel_tank_litres ?? "") : ""} placeholder="e.g. 200" className={inputCls} />
                    <p className="mt-1 text-xs text-slate-400">Used to show your fuel level gauge.</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Boat description <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    defaultValue={isEdit ? (props.description ?? "") : ""}
                    rows={4}
                    placeholder="Describe your boat — builder, year, engine make/model, sails, electronics, any quirks. The AI assistant uses this to give better maintenance advice."
                    className={`${inputCls} resize-none`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    e.g. &quot;1987 Beneteau First 35, Yanmar 2GM20 diesel, roller furling jib&quot;
                  </p>
                </div>

                {state.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
                )}
                {state.success && <SaveSuccessBanner message={state.success} />}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
                >
                  {pending ? (isEdit ? "Saving…" : "Adding…") : (isEdit ? "Save changes" : "Add boat")}
                </button>
              </form>

              {/* Crew (edit only) */}
              {isEdit && (
                <div className="border-t border-slate-100 pt-4">
                  <BoatMembersPanel boatId={props.boatId} boatName={props.boatName} isOwner={props.isOwner} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
