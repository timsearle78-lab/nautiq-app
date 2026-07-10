"use client";

import { useActionState, useState } from "react";
import { updateInventoryItem, deleteInventoryItem } from "@/app/(app)/inventory/[id]/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";
import { Package, AlertTriangle } from "lucide-react";

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
  expiry_date: string | null;
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
          <div className="flex items-center gap-2">
            <Package size={16} className="text-ocean-600" />
            <h2 className="text-base font-semibold text-slate-800">Item details</h2>
          </div>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
              <input name="sku" defaultValue={item.sku ?? ""} className={inputCls} placeholder="Optional part number" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Expiry date</label>
              <input name="expiry_date" type="date" defaultValue={item.expiry_date ?? ""} className={inputCls} />
            </div>
          </div>

          {/* Expiry warning banner */}
          {item.expiry_date && (() => {
            const today = new Date(); today.setHours(0,0,0,0);
            const expiry = new Date(item.expiry_date); expiry.setHours(0,0,0,0);
            const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
            if (daysLeft > 90) return null;
            const expired = daysLeft < 0;
            return (
              <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${expired ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  {expired
                    ? `This item expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago.`
                    : daysLeft === 0
                    ? "This item expires today."
                    : `This item expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`}
                </span>
              </div>
            );
          })()}

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
          {saveState.success && <SaveSuccessBanner message={saveState.success} />}

          <button
            type="submit"
            disabled={savePending}
            className="flex items-center gap-1.5 rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-sm text-slate-600 mb-3">Permanently delete this inventory item. This cannot be undone.</p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete item
          </button>
        ) : (
          <div className="mt-3 rounded-xl border border-red-200 bg-white p-3">
            <p className="text-sm font-semibold text-red-700 mb-3">Delete this item permanently?</p>
            {deleteState.error && (
              <p className="mb-3 text-sm text-red-600">{deleteState.error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <form action={deleteAction} className="inline">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="boat_id" value={item.boat_id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deletePending ? "Deleting…" : "Yes, delete"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
