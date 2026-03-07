"use client";

import { useActionState } from "react";
import { adjustInventoryStock } from "@/lib/inventory/actions";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function StockAdjustForm({
  boatId,
  inventoryItemId,
}: {
  boatId: string;
  inventoryItemId: string;
}) {
  const [state, formAction, pending] = useActionState(
    adjustInventoryStock,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="boat_id" value={boatId} />
      <input type="hidden" name="inventory_item_id" value={inventoryItemId} />

      <select
        name="transaction_type"
        defaultValue="add"
        className="rounded-md border px-2 py-1 text-xs"
      >
        <option value="add">Add</option>
        <option value="consume">Consume</option>
        <option value="correct">Correct</option>
      </select>

      <input
        name="quantity_delta"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue="1"
        className="w-20 rounded-md border px-2 py-1 text-xs"
      />

      <input
        name="notes"
        placeholder="Note"
        className="w-32 rounded-md border px-2 py-1 text-xs"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
      >
        {pending ? "..." : "Update"}
      </button>

      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}

      {state.success ? (
        <span className="text-xs text-green-700">{state.success}</span>
      ) : null}
    </form>
  );
}