"use client";

import { useActionState } from "react";
import { createInventoryItem } from "@/lib/inventory/actions";

type ComponentOption = { id: string; name: string };
type ActionState = { error?: string; success?: string };
const initialState: ActionState = {};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function AddInventoryItemForm({
  boatId,
  components,
}: {
  boatId: string;
  components: ComponentOption[];
}) {
  const [state, formAction, pending] = useActionState(createInventoryItem, initialState);

  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">Add item</h2>
      </div>

      <form action={formAction} className="px-4 py-4 space-y-4">
        <input type="hidden" name="boat_id" value={boatId} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required className={inputCls} placeholder="Fuel filter" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <input name="category" className={inputCls} placeholder="Engine" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Linked component</label>
            <select name="component_id" className={inputCls}>
              <option value="">None</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Qty</label>
            <input name="quantity" type="number" min="0" step="0.01" defaultValue="0" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Min qty</label>
            <input name="minimum_quantity" type="number" min="0" step="0.01" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
            <input name="unit" className={inputCls} placeholder="ea / L" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Storage location</label>
            <input name="storage_location" className={inputCls} placeholder="Starboard locker" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Manufacturer</label>
            <input name="manufacturer" className={inputCls} placeholder="Yanmar" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
          <input name="sku" className={inputCls} placeholder="Optional part number" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Fits YSM12 raw water system"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" name="is_critical" className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
          Mark as critical spare
        </label>

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
          {pending ? "Saving…" : "Add item"}
        </button>
      </form>
    </section>
  );
}
