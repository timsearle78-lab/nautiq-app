"use client";

import { useActionState, useEffect } from "react";
import {
  createComponent,
  type AddComponentActionState,
} from "@/app/(app)/components/new/actions";

type SystemOption = {
  id: string;
  name: string;
};

const initialState: AddComponentActionState = {};

export function AddComponentForm({
  boatId,
  systems,
  noRedirect = false,
  onSuccess,
}: {
  boatId: string;
  systems: SystemOption[];
  noRedirect?: boolean;
  onSuccess?: (componentId: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    createComponent,
    initialState
  );

  useEffect(() => {
    if (state.componentId) {
      const t = setTimeout(() => onSuccess?.(state.componentId!), 1200);
      return () => clearTimeout(t);
    }
  }, [state.componentId, onSuccess]);

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="boat_id" value={boatId} />
      {noRedirect && <input type="hidden" name="no_redirect" value="1" />}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Component name</label>
        <input
          name="name"
          required
          className={inputCls}
          placeholder="Raw water pump"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">System</label>
        <select name="system_id" className={inputCls} defaultValue="">
          <option value="">None</option>
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Install date</label>
        <input name="install_date" type="date" className={inputCls} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Service interval (time-based)</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Years</label>
            <input name="service_interval_years" type="number" min="0" step="1" className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Months</label>
            <input name="service_interval_months" type="number" min="0" step="1" className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Days</label>
            <input name="service_interval_days" type="number" min="0" step="1" className={inputCls} placeholder="0" />
          </div>
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Service interval (engine hours)</label>
        <input
          name="service_interval_engine_hours"
          type="number"
          min="0"
          step="0.1"
          className={inputCls}
          placeholder="200"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          name="notes"
          rows={4}
          className={inputCls}
          placeholder="Optional notes"
        />
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}
      {state.componentId && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Component created
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !!state.componentId}
        className="w-full rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create component"}
      </button>
    </form>
  );
}