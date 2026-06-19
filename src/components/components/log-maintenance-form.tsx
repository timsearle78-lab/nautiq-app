"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logMaintenance, type MaintenanceActionState } from "@/app/(app)/components/[id]/actions";

type InventoryOption = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
};

const initialState: MaintenanceActionState = {};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function LogMaintenanceForm({
  componentId,
  boatId,
  inventoryOptions,
}: {
  componentId: string;
  boatId: string;
  inventoryOptions: InventoryOption[];
}) {
  const [state, formAction, pending] = useActionState(logMaintenance, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <section id="log-maintenance" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">Log maintenance</h2>
      </div>

      <form action={formAction} className="px-4 py-4 space-y-4">
        <input type="hidden" name="component_id" value={componentId} />
        <input type="hidden" name="boat_id" value={boatId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Performed date</label>
            <input name="performed_at" type="date" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Engine hours at service</label>
            <input
              name="engine_hours_at_service"
              type="number"
              min="0"
              step="0.1"
              className={inputCls}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Work done</label>
          <input name="work_done" required className={inputCls} placeholder="Replaced impeller and checked cooling flow" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Vendor</label>
          <input name="vendor" className={inputCls} placeholder="Optional" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
          <textarea name="notes" rows={3} className={`${inputCls} resize-none`} placeholder="Optional notes" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" name="consume_inventory" className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
            Consume spare used during service
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Inventory item</label>
              <select name="inventory_item_id" defaultValue="" className={inputCls}>
                <option value="">None selected</option>
                {inventoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity}{item.unit ? ` ${item.unit}` : ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity used</label>
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

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Log maintenance"}
        </button>
      </form>
    </section>
  );
}
