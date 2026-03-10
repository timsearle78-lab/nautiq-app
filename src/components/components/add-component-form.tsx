"use client";

import { useActionState } from "react";
import {
  createComponent,
  type AddComponentActionState,
} from "@/app/components/new/actions";

type SystemOption = {
  id: string;
  name: string;
};

const initialState: AddComponentActionState = {};

export function AddComponentForm({
  boatId,
  systems,
}: {
  boatId: string;
  systems: SystemOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createComponent,
    initialState
  );

  return (
    <section className="rounded-xl border p-4">
      <h1 className="text-2xl font-semibold">Add Component</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Add a serviceable component to this boat.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="boat_id" value={boatId} />

        <div>
          <label className="mb-1 block text-sm font-medium">Component name</label>
          <input
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Raw water pump"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">System</label>
          <select
            name="system_id"
            className="w-full rounded-md border px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">None</option>
            {systems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Install date</label>
            <input
              name="install_date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Service interval (days)
            </label>
            <input
              name="service_interval_days"
              type="number"
              min="0"
              step="1"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="365"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Service interval (engine hours)
            </label>
            <input
              name="service_interval_engine_hours"
              type="number"
              min="0"
              step="0.1"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Optional notes"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create component"}
        </button>
      </form>
    </section>
  );
}