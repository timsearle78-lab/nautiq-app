"use client";

import { useState } from "react";
import { Anchor, X } from "lucide-react";
import type { TripDraft } from "@/lib/ai/generateTripDraft";
import LogTripSheet from "@/components/chat/log-trip-sheet";
import { formatDate } from "@/lib/format-date";

interface TripDraftCardProps {
  draft: TripDraft;
  boatId: string;
  onSaved?: () => void;
  onDismiss?: () => void;
}


export default function TripDraftCard({ draft, boatId, onSaved, onDismiss }: TripDraftCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const issues = draft.issues_observed.filter(s => s && !/^no issues?$/i.test(s.trim()));
  const combinedNotes = [
    draft.notes || null,
    issues.length > 0 ? `Issues: ${issues.join(", ")}` : null,
  ].filter(Boolean).join("\n\n") || null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  function handleSaved() {
    setDismissed(true);
    onSaved?.();
  }

  if (dismissed) return null;

  return (
    <>
      <div className="mx-3 mt-3 rounded-2xl border border-ocean-200 bg-ocean-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
          <div className="flex-shrink-0 mt-0.5 rounded-full bg-ocean-100 p-1.5">
            <Anchor size={14} className="text-ocean-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">Trip record ready to save</div>
            {(draft.started_at || draft.engine_hours_delta != null) && (
              <div className="mt-2 space-y-0.5">
                {draft.notes && (
                  <div className="text-sm text-slate-700 font-medium truncate">{draft.notes}</div>
                )}
                <div className="flex items-center gap-3">
                  {draft.started_at && (
                    <div className="text-xs text-ocean-600">{formatDate(draft.started_at)}</div>
                  )}
                  {draft.engine_hours_delta != null && (
                    <div className="text-xs text-slate-400">{draft.engine_hours_delta}h engine</div>
                  )}
                  {draft.fuel_added_litres != null && (
                    <div className="text-xs text-slate-400">{draft.fuel_added_litres}L fuel</div>
                  )}
                </div>
                {issues.length > 0 && (
                  <div className="mt-1 text-xs text-amber-600">
                    ⚠ {issues.join(" · ")}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
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
            <Anchor size={14} />
            Review and save
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LogTripSheet
          boatId={boatId}
          prefillStartedAt={draft.started_at}
          prefillEndedAt={draft.ended_at}
          prefillEngineHours={draft.engine_hours_delta}
          prefillFuelLitres={draft.fuel_added_litres}
          prefillNotes={combinedNotes}
          prefillSource={draft.source}
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
