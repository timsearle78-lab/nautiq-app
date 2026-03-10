"use client";

import { useActionState } from "react";
import { logMaintenance, type MaintenanceActionState } from "@/app/components/[id]/actions";

type InventoryOption = {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
};

const initialState: MaintenanceActionState = {};

export function LogMaintenanceForm({
  componentId,
  boatId,
  inventoryOptions,
}: {
  componentId: string;
  boatId: string;
  inventoryOptions: InventoryOption[];
}) {
  const [state, formAction, pending] = useActionState(
    logMaintenance,
    initialState
  );

  return (
      <section id="log-maintenance" className="rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Log maintenance</h2>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="component_id" value={componentId} />
        <input type="hidden" name="boat_id" value={boatId} />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Performed date</label>
            <input
              name="performed_at"
              type="date"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Engine hours at service
            </label>
            <input
              name="engine_hours_at_service"
              type="number"
              min="0"
              step="0.1"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Work done</label>
          <input
            name="work_done"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Replaced impeller and checked cooling flow"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Vendor</label>
          <input
            name="vendor"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional notes"
          />
        </div>

        <div className="rounded-lg border p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="consume_inventory" />
            Consume spare used during service
          </label>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Inventory item</label>
              <select
                name="inventory_item_id"
                className="w-full rounded-md border px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">None selected</option>
                {inventoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit ?? ""})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Quantity used</label>
              <input
                name="inventory_quantity_used"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue="1"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        {state.success ? (
          <p className="text-sm text-green-700">{state.success}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Saving..." : "Log maintenance"}
        </button>
      </form>
    </section>
  );
}