"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import TripDraftCard from "./trip-draft-card";
import MaintenanceDraftCard from "./maintenance-draft-card";
import InventoryAdjustCard from "./inventory-adjust-card";
import { MaintenanceListCard, MaintenanceHistoryCard, InventoryListCard, TripHistoryCard, BoatSummaryCard } from "./data-cards";
import ReportCard from "./report-card";

interface MessageBubbleProps {
  message: UIMessage;
  boatId: string;
  onTripSaved?: () => void;
}

export default function MessageBubble({ message, boatId, onTripSaved }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [tripDone, setTripDone] = useState(false);

  if (isUser) {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");

    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-ocean-600 px-4 py-2.5 text-sm text-white">
          {text}
        </div>
      </div>
    );
  }

  // If this message contains a trip draft, suppress all text parts once done
  const hasTripDraft = message.parts.some((p) => (p as { type: string }).type === "tool-draftTripLog");

  // Assistant message — render parts
  return (
    <div className="flex flex-col gap-1 max-w-[92%]">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          const text = (part as { type: "text"; text: string }).text;
          if (!text.trim()) return null;
          if (hasTripDraft && tripDone) return null;
          if (hasTripDraft) return null; // text is redundant alongside the card
          return (
            <div
              key={i}
              className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-sm chat-md"
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                  ul: ({ children }) => <ul className="mt-1 mb-2 space-y-0.5 pl-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mt-1 mb-2 space-y-0.5 pl-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="leading-snug">{children}</li>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          );
        }

        // Tool results
        const toolPart = part as {
          type: string;
          state?: string;
          output?: unknown;
          errorText?: string;
        };

        if (!toolPart.type.startsWith("tool-")) return null;
        if (toolPart.state === "output-error") {
          return (
            <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Something went wrong processing your request. Please try again.
            </div>
          );
        }
        if (toolPart.state !== "output-available") return null;

        const toolName = toolPart.type.replace("tool-", "");
        const output = toolPart.output as Record<string, unknown>;

        if (toolName === "draftMaintenanceLog") {
          if (output?.components) {
            return (
              <MaintenanceDraftCard
                key={i}
                prefill={{
                  componentName: String(output.componentName ?? ""),
                  workDone: String(output.workDone ?? ""),
                  performedAt: String(output.performedAt ?? new Date().toISOString().slice(0, 10)),
                  notes: output.notes ? String(output.notes) : undefined,
                  engineHours: output.engineHoursAtService != null ? Number(output.engineHoursAtService) : null,
                }}
                components={(output.components ?? []) as Parameters<typeof MaintenanceDraftCard>[0]["components"]}
                inventoryOptions={(output.inventoryItems ?? []) as Parameters<typeof MaintenanceDraftCard>[0]["inventoryOptions"]}
                boatId={boatId}
                onDone={() => {}}
              />
            );
          }
          return (
            <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {"Couldn't extract maintenance details. Please try again or log manually."}
            </div>
          );
        }

        if (toolName === "draftTripLog") {
          if (output?.draft) {
            return (
              <TripDraftCard
                key={i}
                draft={output.draft as Parameters<typeof TripDraftCard>[0]["draft"]}
                boatId={boatId}
                onSaved={() => { setTripDone(true); onTripSaved?.(); }}
                onDismiss={() => setTripDone(true)}
              />
            );
          }
          return (
            <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {"Couldn't extract trip details. Please try again or log manually."}
              {output?.error != null && <div className="mt-1 text-xs font-mono opacity-70">{String(output.error)}</div>}
            </div>
          );
        }

        if (toolName === "draftInventoryAdjustment" || toolName === "draftInventoryAdd") {
          return (
            <InventoryAdjustCard
              key={i}
              searchTerm={String(output.searchTerm ?? "")}
              matches={(output.matches ?? []) as Parameters<typeof InventoryAdjustCard>[0]["matches"]}
              quantity={Number(output.quantity ?? 1)}
              transactionType={(output.transactionType as "add" | "consume") ?? "consume"}
              reason={String(output.reason ?? "")}
              boatId={boatId}
            />
          );
        }

        if (toolName === "getUpcomingMaintenance") {
          return (
            <MaintenanceListCard
              key={i}
              items={(output as unknown as Parameters<typeof MaintenanceListCard>[0]["items"])}
            />
          );
        }

        if (toolName === "getInventoryStatus") {
          return (
            <InventoryListCard
              key={i}
              items={(output as unknown as Parameters<typeof InventoryListCard>[0]["items"])}
            />
          );
        }

        if (toolName === "getMaintenanceHistory") {
          return (
            <MaintenanceHistoryCard
              key={i}
              items={(output as unknown as Parameters<typeof MaintenanceHistoryCard>[0]["items"])}
            />
          );
        }

        if (toolName === "getTripHistory") {
          return (
            <TripHistoryCard
              key={i}
              trips={(output as unknown as Parameters<typeof TripHistoryCard>[0]["trips"])}
            />
          );
        }

        if (toolName === "getPersonalizedGreeting") {
          const greetingText = String(output?.greetingText ?? "");
          if (!greetingText) return null;
          return (
            <div
              key={i}
              className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-sm"
            >
              {greetingText}
            </div>
          );
        }

        if (toolName === "requestBoatReport") {
          return <ReportCard key={i} />;
        }

        if (toolName === "getBoatSummary") {
          return (
            <BoatSummaryCard
              key={i}
              summary={(output as unknown as Parameters<typeof BoatSummaryCard>[0]["summary"])}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
