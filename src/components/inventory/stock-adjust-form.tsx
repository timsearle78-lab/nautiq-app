"use client";

import { useActionState } from "react";
import { adjustInventoryStock } from "@/lib/inventory/actions";
import SaveSuccessBanner from "@/components/ui/save-success-banner";

type ActionState = { error?: string; success?: string };
const initialState: ActionState = {};

export function StockAdjustForm({
  boatId,
  inventoryItemId,
}: {
  boatId: string;
  inventoryItemId: string;
}) {
  const [state, formAction, pending] = useActionState(adjustInventoryStock, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="boat_id" value={boatId} />
      <input type="hidden" name="inventory_item_id" value={inventoryItemId} />

      <select
        name="transaction_type"
        defaultValue="add"
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-100"
      >
        <option value="add">Add</option>
        <option value="consume">Use</option>
        <option value="correct">Set</option>
      </select>

      <input
        name="quantity_delta"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue="1"
        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-100"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ocean-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
      >
        {pending ? "…" : "Update"}
      </button>

      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && <SaveSuccessBanner message={state.success} />}
    </form>
  );
}
