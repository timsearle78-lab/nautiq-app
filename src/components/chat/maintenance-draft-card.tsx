"use client";

import { useState, useTransition } from "react";
import { Mail, Wrench, X } from "lucide-react";
import { dismissDraft, type MaintenanceDraft } from "@/lib/maintenance-drafts";
import LogMaintenanceSheet from "@/components/components/log-maintenance-sheet";

interface Props {
  draft: MaintenanceDraft;
  boatId: string;
  components: { id: string; name: string }[];
  inventoryOptions: { id: string; name: string; quantity: number; unit: string | null }[];
  onDone: () => void;
}

export default function MaintenanceDraftCard({ draft, boatId, components, inventoryOptions, onDone }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDismissing, startDismiss] = useTransition();

  function handleDismiss() {
    startDismiss(async () => {
      await dismissDraft(draft.id);
      onDone();
    });
  }

  function handleSaved() {
    startDismiss(async () => {
      await dismissDraft(draft.id);
      onDone();
    });
  }

  // Find a matching component id by name
  const matchedComponent = draft.parsed_component_name
    ? components.find((c) =>
        c.name.toLowerCase().includes((draft.parsed_component_name ?? "").toLowerCase()) ||
        (draft.parsed_component_name ?? "").toLowerCase().includes(c.name.toLowerCase())
      )
    : null;

  return (
    <>
      <div className="mx-3 mt-3 rounded-2xl border border-ocean-200 bg-ocean-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
          <div className="flex-shrink-0 mt-0.5 rounded-full bg-ocean-100 p-1.5">
            <Mail size={14} className="text-ocean-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">Maintenance email received</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {draft.email_subject ?? "No subject"}
            </div>
            {(draft.parsed_work_done || draft.parsed_component_name) && (
              <div className="mt-2 space-y-0.5">
                {draft.parsed_work_done && (
                  <div className="text-sm text-slate-700 font-medium">{draft.parsed_work_done}</div>
                )}
                {draft.parsed_component_name && (
                  <div className="text-xs text-ocean-600">{draft.parsed_component_name}</div>
                )}
                {draft.parsed_performed_at && (
                  <div className="text-xs text-slate-400">
                    {new Date(draft.parsed_performed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isDismissing}
            className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-ocean-100 hover:text-slate-600 transition"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pb-3.5">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 w-full justify-center rounded-xl py-2.5 text-sm font-semibold text-white transition"
            style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
          >
            <Wrench size={14} />
            Complete maintenance record
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LogMaintenanceSheet
          boatId={boatId}
          componentId={matchedComponent?.id ?? null}
          components={components}
          inventoryOptions={inventoryOptions}
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
          prefill={{
            workDone: draft.parsed_work_done ?? undefined,
            performedAt: draft.parsed_performed_at ?? undefined,
            engineHours: draft.parsed_engine_hours ?? undefined,
            vendor: draft.parsed_vendor ?? undefined,
            notes: draft.parsed_notes ?? undefined,
          }}
        />
      )}
    </>
  );
}
