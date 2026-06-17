"use client";

import type { UIMessage } from "ai";
import TripDraftCard from "./trip-draft-card";
import InventoryAdjustCard from "./inventory-adjust-card";

interface MessageBubbleProps {
  message: UIMessage;
  boatId: string;
  onTripSaved?: () => void;
}

export default function MessageBubble({ message, boatId, onTripSaved }: MessageBubbleProps) {
  const isUser = message.role === "user";

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

  // Assistant message — render parts
  return (
    <div className="flex flex-col gap-1 max-w-[92%]">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          const text = (part as { type: "text"; text: string }).text;
          if (!text.trim()) return null;
          return (
            <div
              key={i}
              className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-sm"
            >
              {text}
            </div>
          );
        }

        // Tool results
        const toolPart = part as {
          type: string;
          state?: string;
          output?: unknown;
        };

        if (!toolPart.type.startsWith("tool-")) return null;
        if (toolPart.state !== "output-available") return null;

        const toolName = toolPart.type.replace("tool-", "");
        const output = toolPart.output as Record<string, unknown>;

        if (toolName === "draftTripLog" && output?.draft) {
          return (
            <TripDraftCard
              key={i}
              draft={output.draft as Parameters<typeof TripDraftCard>[0]["draft"]}
              boatId={boatId}
              onSaved={onTripSaved}
            />
          );
        }

        if (toolName === "draftInventoryAdjustment") {
          return (
            <InventoryAdjustCard
              key={i}
              searchTerm={String(output.searchTerm ?? "")}
              matches={(output.matches ?? []) as Parameters<typeof InventoryAdjustCard>[0]["matches"]}
              quantityUsed={Number(output.quantityUsed ?? 1)}
              reason={String(output.reason ?? "")}
              boatId={boatId}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
