"use client";

import { useState, useTransition } from "react";
import { Mail, Anchor, X } from "lucide-react";
import type { TripDraftFromEmail } from "@/lib/trip-drafts";
import { dismissTripDraft } from "@/lib/trip-drafts";
import LogTripSheet from "@/components/chat/log-trip-sheet";
import { formatDate } from "@/lib/format-date";

interface Props {
  draft: TripDraftFromEmail;
  onDone: () => void;
}


export default function EmailTripDraftCard({ draft, onDone }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDismissing, startDismiss] = useTransition();

  function handleDismiss() {
    startDismiss(async () => {
      await dismissTripDraft(draft.id);
      onDone();
    });
  }

  function handleSaved() {
    startDismiss(async () => {
      await dismissTripDraft(draft.id);
      onDone();
    });
  }

  return (
    <>
      <div className="mx-3 mt-3 rounded-2xl border border-ocean-200 bg-ocean-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
          <div className="flex-shrink-0 mt-0.5 rounded-full bg-ocean-100 p-1.5">
            <Mail size={14} className="text-ocean-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800">Trip email received</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {draft.email_subject ?? "No subject"}
            </div>
            {(draft.parsed_notes || draft.parsed_started_at || draft.parsed_engine_hours != null) && (
              <div className="mt-2 space-y-0.5">
                {draft.parsed_notes && (
                  <div className="text-sm text-slate-700 font-medium truncate">{draft.parsed_notes}</div>
                )}
                <div className="flex items-center gap-3">
                  {draft.parsed_started_at && (
                    <div className="text-xs text-ocean-600">{formatDate(draft.parsed_started_at)}</div>
                  )}
                  {draft.parsed_engine_hours != null && (
                    <div className="text-xs text-slate-400">{draft.parsed_engine_hours}h engine</div>
                  )}
                  {draft.parsed_fuel_litres != null && (
                    <div className="text-xs text-slate-400">{draft.parsed_fuel_litres}L fuel</div>
                  )}
                </div>
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
            <Anchor size={14} />
            Complete trip record
          </button>
        </div>
      </div>

      {sheetOpen && (
        <LogTripSheet
          boatId={draft.boat_id ?? ""}
          prefillStartedAt={draft.parsed_started_at}
          prefillEndedAt={draft.parsed_ended_at}
          prefillEngineHours={draft.parsed_engine_hours}
          prefillFuelLitres={draft.parsed_fuel_litres}
          prefillNotes={[draft.parsed_notes, draft.parsed_issues ? `Issues: ${draft.parsed_issues}` : null].filter(Boolean).join("\n") || null}
          prefillSource="email"
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
