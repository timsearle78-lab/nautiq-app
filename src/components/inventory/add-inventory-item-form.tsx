"use client";

import { useActionState } from "react";
import { createInventoryItem } from "@/lib/inventory/actions";

type ComponentOption = {
  id: string;
  name: string;
};

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export function AddInventoryItemForm({
  boatId,
  components,
}: {
  boatId: string;
  components: ComponentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createInventoryItem,
    initialState
  );

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-lg font-semibold">Add inventory item</h2>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="boat_id" value={boatId} />

        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Fuel filter"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <input
              name="category"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Engine"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Linked component
            </label>
            <select
              name="component_id"
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Quantity</label>
            <input
              name="quantity"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Minimum qty
            </label>
            <input
              name="minimum_quantity"
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Unit</label>
            <input
              name="unit"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="ea / L / m"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Storage location
            </label>
            <input
              name="storage_location"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Starboard locker"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Manufacturer
            </label>
            <input
              name="manufacturer"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Yanmar"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">SKU</label>
          <input
            name="sku"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional part number"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Fits YSM12 raw water system"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_critical" />
          Mark as critical spare
        </label>

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
          {pending ? "Saving..." : "Add item"}
        </button>
      </form>
    </section>
  );
}