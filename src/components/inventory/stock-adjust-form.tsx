"use client";

import { useActionState } from "react";
import { adjustInventoryStock } from "@/lib/inventory/actions";

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
        className="rounded-lg bg-ocean-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-ocean-700 disabled:opacity-50"
      >
        {pending ? "…" : "Update"}
      </button>

      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && (
        <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {state.success}
        </span>
      )}
    </form>
  );
}
