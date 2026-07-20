"use client";

import { useState } from "react";
import { ClipboardList, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from "next/link";
import type { SuggestedComponent } from "@/lib/component-suggestions";

interface MissingComponentsCardProps {
  boatType: string | null;
  suggestions: SuggestedComponent[];
}

export default function MissingComponentsCard({ boatType, suggestions }: MissingComponentsCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (suggestions.length === 0) return null;

  const preview = suggestions.slice(0, 3);
  const rest = suggestions.slice(3);

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}
          >
            <ClipboardList size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Maintenance gaps for your {boatType ?? "boat"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {suggestions.length} component{suggestions.length !== 1 ? "s" : ""} worth tracking
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-amber-200">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 px-4 py-3 border-b border-amber-100 last:border-0 bg-white/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.system} · {s.reason}</p>
              </div>
              <Link
                href={`/components/new?name=${encodeURIComponent(s.name)}&system=${encodeURIComponent(s.system)}`}
                className="shrink-0 flex items-center gap-1 rounded-full btn-primary px-2.5 py-1 text-xs font-semibold text-white"
              >
                <Plus size={11} />
                Add
              </Link>
            </div>
          ))}
        </div>
      )}

      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-500">
            e.g. {preview.map((s) => s.name).join(", ")}
            {rest.length > 0 ? ` and ${rest.length} more…` : ""}
          </p>
        </div>
      )}

      <div className="border-t border-amber-200 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          {expanded ? "Show less" : "See all suggestions"}
        </button>
        <Link href="/components/new" className="text-xs text-slate-400 hover:text-slate-600">
          Add manually →
        </Link>
      </div>
    </div>
  );
}
