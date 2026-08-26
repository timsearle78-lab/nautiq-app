"use client";

import { useState, useTransition } from "react";
import { Mail, Wrench, X } from "lucide-react";
import { dismissDraft, type MaintenanceDraft } from "@/lib/maintenance-drafts";
import LogMaintenanceSheet from "@/components/components/log-maintenance-sheet";

type Prefill = {
  componentName?: string;
  workDone?: string;
  performedAt?: string;
  engineHours?: number | null;
  vendor?: string;
  notes?: string;
};

interface Props {
  // Email-inbound draft mode
  draft?: MaintenanceDraft;
  // AI chat / manual prefill mode
  prefill?: Prefill;

  boatId: string;
  components: { id: string; name: string }[];
  inventoryOptions: { id: string; name: string; quantity: number; unit: string | null }[];
  onDone: () => void;
}

export default function MaintenanceDraftCard({ draft, prefill, boatId, components, inventoryOptions, onDone }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDismissing, startDismiss] = useTransition();

  const isEmail = !!draft;

  // Normalise prefill from whichever source
  const componentName = draft?.parsed_component_name ?? prefill?.componentName ?? null;
  const sheetPrefill = {
    workDone: draft?.parsed_work_done ?? prefill?.workDone ?? undefined,
    performedAt: draft?.parsed_performed_at ?? prefill?.performedAt ?? undefined,
    engineHours: draft?.parsed_engine_hours ?? prefill?.engineHours ?? undefined,
    vendor: draft?.parsed_vendor ?? prefill?.vendor ?? undefined,
    notes: draft?.parsed_notes ?? prefill?.notes ?? undefined,
  };

  const matchedComponent = componentName
    ? components.find(
        (c) =>
          c.name.toLowerCase().includes(componentName.toLowerCase()) ||
          componentName.toLowerCase().includes(c.name.toLowerCase())
      )
    : null;

  function handleDismiss() {
    if (draft) {
      startDismiss(async () => {
        await dismissDraft(draft.id);
        onDone();
      });
    } else {
      onDone();
    }
  }

  function handleSaved() {
    if (draft) {
      startDismiss(async () => {
        await dismissDraft(draft.id);
        onDone();
      });
    } else {
      onDone();
    }
  }

  return (
    <>
      <div className="mx-3 mt-3 rounded-2xl border border-ocean-200 bg-ocean-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
          <div className="flex-shrink-0 mt-0.5 rounded-full bg-ocean-100 p-1.5">
            {isEmail ? <Mail size={14} className="text-ocean-600" /> : <Wrench size={14} className="text-ocean-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">
              {isEmail ? "Maintenance email received" : "Maintenance record ready to save"}
            </div>
            {isEmail && (
              <div className="text-xs text-slate-500 mt-0.5 truncate">
                {draft.email_subject ?? "No subject"}
              </div>
            )}
            {(sheetPrefill.workDone || componentName) && (
              <div className="mt-2 space-y-0.5">
                {sheetPrefill.workDone && (
                  <div className="text-sm text-slate-700 font-medium">{sheetPrefill.workDone}</div>
                )}
                {componentName && (
                  <div className="text-xs text-ocean-600">{componentName}</div>
                )}
                {sheetPrefill.performedAt && (
                  <div className="text-xs text-slate-400">
                    {new Date(sheetPrefill.performedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
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
            style={{ background: "#0B7EB8" }}
          >
            <Wrench size={14} />
            {isEmail ? "Complete maintenance record" : "Review and save"}
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LogMaintenanceSheet
          boatId={boatId}
          componentId={null}
          defaultComponentId={matchedComponent?.id ?? null}
          components={components}
          inventoryOptions={inventoryOptions}
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
          prefill={sheetPrefill}
        />
      )}
    </>
  );
}
