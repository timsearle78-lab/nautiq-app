"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInventoryItem } from "@/lib/inventory/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { enqueue } from "@/lib/offline-queue";
import { useOfflineSync } from "@/components/providers/offline-sync-provider";

type ComponentOption = { id: string; name: string };
type ActionState = { error?: string; success?: string };
const initialState: ActionState = {};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

export function AddInventoryItemForm({
  boatId,
  components,
  categories = [],
  onSuccess,
}: {
  boatId: string;
  components: ComponentOption[];
  categories?: string[];
  onSuccess?: () => void;
}) {
  const isOnline = useOnlineStatus();
  const { refreshPendingCount } = useOfflineSync();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      if (!isOnline) {
        enqueue({
          type: "inventory-item",
          payload: {
            boat_id: String(fd.get("boat_id") ?? ""),
            name: String(fd.get("name") ?? ""),
            category: String(fd.get("category") ?? "") || null,
            component_id: String(fd.get("component_id") ?? "") || null,
            quantity: String(fd.get("quantity") ?? "0"),
            minimum_quantity: String(fd.get("minimum_quantity") ?? "") || null,
            unit: String(fd.get("unit") ?? "") || null,
            storage_location: String(fd.get("storage_location") ?? "") || null,
            manufacturer: String(fd.get("manufacturer") ?? "") || null,
            sku: String(fd.get("sku") ?? "") || null,
            expiry_date: String(fd.get("expiry_date") ?? "") || null,
            notes: String(fd.get("notes") ?? "") || null,
            is_critical: fd.get("is_critical") === "on",
          },
        });
        refreshPendingCount();
        return { success: "Saved offline — will sync when reconnected" };
      }
      return createInventoryItem(prev, fd);
    },
    initialState
  );

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => onSuccess?.(), 1200);
      return () => clearTimeout(t);
    }
  }, [state.success, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="boat_id" value={boatId} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required className={inputCls} placeholder="Fuel filter" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <input name="category" list="category-options" className={inputCls} placeholder="Engine" autoComplete="off" />
            <datalist id="category-options">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Linked component</label>
            <select name="component_id" className="select-field">
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
            <select name="unit" className="select-field">
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
            <input name="storage_location" className={inputCls} placeholder="Starboard locker" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Manufacturer</label>
            <input name="manufacturer" className={inputCls} placeholder="Yanmar" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
            <input name="sku" className={inputCls} placeholder="Optional item number" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Expiry date</label>
            <input name="expiry_date" type="date" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
          <textarea name="notes" rows={3} className={`${inputCls} resize-none`} placeholder="e.g. fits YSM12" />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" name="is_critical" className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500" />
          Mark as critical item
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_fuel_source"
            className="h-4 w-4 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
          />
          <span className="text-sm text-slate-700">Primary fuel source (used for fuel gauge)</span>
        </label>

        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state.success && <SaveSuccessBanner message={state.success} />}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add item"}
        </button>
    </form>
  );
}
