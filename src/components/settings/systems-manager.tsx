"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addSystem, deleteSystem } from "@/app/(app)/settings/actions";

type SystemRow = { id: string; name: string };

type AddProps = { boatId: string };

function AddSystemForm({ boatId }: AddProps) {
  const [state, action, pending] = useActionState(addSystem, {});

  return (
    <form action={action} className="flex gap-2 mt-3">
      <input type="hidden" name="boat_id" value={boatId} />
      <input
        name="name"
        required
        placeholder="e.g. Engine, Electrical, Deck"
        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700 disabled:opacity-60 whitespace-nowrap"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state.error && <span className="text-sm text-red-600 self-center">{state.error}</span>}
    </form>
  );
}

function DeleteSystemForm({ systemId }: { systemId: string }) {
  const [, action, pending] = useActionState(deleteSystem, {});

  return (
    <form action={action}>
      <input type="hidden" name="system_id" value={systemId} />
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
        title="Delete system"
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}

export function SystemsManager({ boatId, systems }: { boatId: string; systems: SystemRow[] }) {
  return (
    <div>
      {systems.length === 0 ? (
        <p className="text-sm text-slate-500">No systems yet. Add one below.</p>
      ) : (
        <ul className="space-y-1">
          {systems.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-800">{s.name}</span>
              <DeleteSystemForm systemId={s.id} />
            </li>
          ))}
        </ul>
      )}
      <AddSystemForm boatId={boatId} />
    </div>
  );
}
