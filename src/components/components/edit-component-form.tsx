"use client";

import { useActionState } from "react";
import { updateComponent, deleteComponent } from "@/app/(app)/components/[id]/actions";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100";

type System = { id: string; name: string };

type Props = {
  id: string;
  name: string;
  systemId?: string | null;
  systems: System[];
  installDate?: string | null;
  serviceIntervalYears?: number | null;
  serviceIntervalMonths?: number | null;
  serviceIntervalDays?: number | null;
  serviceIntervalEngineHours?: number | null;
  notes?: string | null;
};

export function EditComponentForm({
  id,
  name,
  systemId,
  systems,
  installDate,
  serviceIntervalYears,
  serviceIntervalMonths,
  serviceIntervalDays,
  serviceIntervalEngineHours,
  notes,
}: Props) {
  const [updateState, updateAction, updatePending] = useActionState(updateComponent, {});
  const [deleteState, deleteAction, deletePending] = useActionState(deleteComponent, {});

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">Edit component</h2>

        <form action={updateAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={id} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={name}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              System
            </label>
            <select name="system_id" defaultValue={systemId ?? ""} className={inputCls}>
              <option value="">None</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Install date
            </label>
            <input
              type="date"
              name="install_date"
              defaultValue={installDate ?? ""}
              className={inputCls}
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 mb-2">
              Service interval (time-based)
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Years</label>
                <input
                  type="number"
                  name="service_interval_years"
                  defaultValue={serviceIntervalYears ?? ""}
                  min={0}
                  step={1}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Months</label>
                <input
                  type="number"
                  name="service_interval_months"
                  defaultValue={serviceIntervalMonths ?? ""}
                  min={0}
                  step={1}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Days</label>
                <input
                  type="number"
                  name="service_interval_days"
                  defaultValue={serviceIntervalDays ?? ""}
                  min={0}
                  step={1}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service interval (engine hours)
            </label>
            <input
              type="number"
              name="service_interval_engine_hours"
              defaultValue={serviceIntervalEngineHours ?? ""}
              min={0}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              defaultValue={notes ?? ""}
              rows={3}
              className={inputCls}
            />
          </div>

          {updateState.error && (
            <p className="text-sm text-red-600">{updateState.error}</p>
          )}
          {updateState.success && (
            <p className="text-sm text-green-600">{updateState.success}</p>
          )}

          <button
            type="submit"
            disabled={updatePending}
            className="rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-ocean-700 disabled:opacity-60"
          >
            {updatePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>

        <form action={deleteAction} className="mt-3">
          <input type="hidden" name="id" value={id} />

          <p className="text-sm text-slate-600 mb-3">
            Permanently delete this component and all its maintenance history. This cannot be undone.
          </p>

          {deleteState.error && (
            <p className="text-sm text-red-600 mb-2">{deleteState.error}</p>
          )}

          <button
            type="submit"
            disabled={deletePending}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deletePending ? "Deleting…" : "Delete component"}
          </button>
        </form>
      </div>
    </div>
  );
}
