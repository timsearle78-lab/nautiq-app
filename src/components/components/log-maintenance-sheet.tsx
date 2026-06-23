"use client";

import { useActionState, useState } from "react";
import { X, Wrench } from "lucide-react";
import SaveSuccessSheet from "@/components/ui/save-success-sheet";
import NautiqSpinner from "@/components/ui/nautiq-spinner";
import { logMaintenance } from "@/app/(app)/components/[id]/actions";
import VoiceTextarea from "@/components/ui/voice-textarea";

type InventoryOption = { id: string; name: string; quantity: number; unit: string | null };
type ComponentOption = { id: string; name: string };

interface Props {
  boatId: string;
  // When opened from the component page, componentId is pre-set and no picker is shown.
  // When opened from chat/global, componentId is null and a picker is shown.
  componentId: string | null;
  components?: ComponentOption[];       // Required when componentId is null
  inventoryOptions: InventoryOption[];
  onClose: () => void;
  onSaved: () => void;
}

function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}

export default function LogMaintenanceSheet({
  boatId,
  componentId: initialComponentId,
  components = [],
  inventoryOptions,
  onClose,
  onSaved,
}: Props) {
  const [selectedComponentId, setSelectedComponentId] = useState(initialComponentId ?? "");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; success?: string }, fd: FormData) => {
      const result = await logMaintenance(prev, fd);
      if (result.success) { setSaved(true); setTimeout(onSaved, 1400); }
      return result;
    },
    {}
  );

  const effectiveComponentId = initialComponentId ?? selectedComponentId;

  if (saved) return <SaveSuccessSheet message="Maintenance logged!" />;

  const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-ocean-500 focus:outline-none";

  return (
    <>
      {pending && <NautiqSpinner overlay />}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-ocean-600" />
            <h2 className="text-base font-semibold text-slate-900">Log Maintenance</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="p-4 pb-8 space-y-4">
          <input type="hidden" name="boat_id" value={boatId} />
          <input type="hidden" name="component_id" value={effectiveComponentId} />

          {/* Component picker — only shown when not pre-set */}
          {!initialComponentId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Component <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedComponentId}
                onChange={(e) => setSelectedComponentId(e.target.value)}
                required
                className={inputCls}
              >
                <option value="">Select a component…</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                name="performed_at"
                type="date"
                defaultValue={todayLocal()}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Engine hours</label>
              <input
                name="engine_hours_at_service"
                type="number"
                min="0"
                step="0.1"
                placeholder="Optional"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Work done <span className="text-red-500">*</span>
              </label>
              <input
                name="work_done"
                required
                placeholder="e.g. Replaced impeller"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vendor</label>
              <input name="vendor" placeholder="Optional" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <VoiceTextarea value={notes} onChange={setNotes} placeholder="Any additional details…" rows={3} />
            <input type="hidden" name="notes" value={notes} />
          </div>

          {/* Consume spare */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Item used during service</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item</label>
                <select name="inventory_item_id" defaultValue="" className={inputCls}>
                  <option value="">None</option>
                  {inventoryOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity}{item.unit ? ` ${item.unit}` : ""})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Qty used</label>
                <input
                  name="inventory_quantity_used"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue="1"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending || (!initialComponentId && !selectedComponentId)}
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
          >
            {pending ? "Saving…" : "Save maintenance record"}
          </button>
        </form>
      </div>
    </>
  );
}
