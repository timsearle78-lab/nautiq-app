"use client";

import { useActionState, useState } from "react";
import { updateInventoryItem, deleteInventoryItem } from "@/app/(app)/inventory/[id]/actions";

type ComponentOption = { id: string; name: string };

type Item = {
  id: string;
  boat_id: string;
  component_id: string | null;
  name: string;
  category: string | null;
  sku: string | null;
  manufacturer: string | null;
  quantity: number;
  minimum_quantity: number | null;
  unit: string | null;
  storage_location: string | null;
  notes: string | null;
  is_critical: boolean;
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function EditInventoryItemForm({
  item,
  components,
  categories = [],
}: {
  item: Item;
  components: ComponentOption[];
  categories?: string[];
}) {
  const [saveState, saveAction, savePending] = useActionState(updateInventoryItem, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteInventoryItem, {});
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Item details</h2>
        </div>

        <form action={saveAction} className="px-4 py-4 space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="boat_id" value={item.boat_id} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input name="name" required defaultValue={item.name} className={inputCls} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <input name="category" list="category-options" defaultValue={item.category ?? ""} className={inputCls} placeholder="Engine" autoComplete="off" />
              <datalist id="category-options">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Linked component</label>
              <select name="component_id" defaultValue={item.component_id ?? ""} className={inputCls}>
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
              <input name="quantity" type="number" min="0" step="0.01" defaultValue={String(item.quantity)} required className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Min qty</label>
              <input name="minimum_quantity" type="number" min="0" step="0.01" defaultValue={item.minimum_quantity ?? ""} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
              <select name="unit" defaultValue={item.unit ?? ""} className={inputCls}>
                <option value="">— select —</option>
                <option value="ea">ea (each)</option>
                <option value="L">L (litres)</option>
                <option value="mL">mL (millilitres)</option>
                <option value="kg">kg (kilograms)</option>
                <option value="g">g (grams)</option>
                <option value="m">m (metres)</option>
                <option value="pair">pair</option>
                <option value="set">set</option>
                <option value="roll">roll</option>
                <option value="box">box</option>
                <option value="can">can</option>
                <option value="tube">tube</option>
                <option value="bottle">bottle</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Storage location</label>
              <input name="storage_location" defaultValue={item.storage_location ?? ""} className={inputCls} placeholder="Starboard locker" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Manufacturer</label>
              <input name="manufacturer" defaultValue={item.manufacturer ?? ""} className={inputCls} placeholder="Yanmar" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
            <input name="sku" defaultValue={item.sku ?? ""} className={inputCls} placeholder="Optional part number" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea name="notes" rows={3} defaultValue={item.notes ?? ""} className={`${inputCls} resize-none`} placeholder="Optional notes" />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" name="is_critical" defaultChecked={item.is_critical} className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
            Mark as critical spare
          </label>

          {saveState.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveState.error}</div>
          )}
          {saveState.success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {saveState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={savePending}
            className="flex items-center gap-1.5 rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-red-100">
          <h2 className="text-base font-semibold text-red-700">Danger zone</h2>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm text-slate-500 mb-3">Permanently delete this inventory item. This cannot be undone.</p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete item
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700 mb-3">Delete this item permanently?</p>
              {deleteState.error && (
                <p className="mb-3 text-sm text-red-600">{deleteState.error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <form action={deleteAction} className="inline">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="boat_id" value={item.boat_id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletePending ? "Deleting…" : "Yes, delete"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
