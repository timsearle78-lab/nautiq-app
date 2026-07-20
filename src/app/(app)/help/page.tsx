"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ArrowLeft, MessageCircle } from "lucide-react";
import { HELP_SECTIONS } from "@/lib/help-content";

function HelpAccordion({ title, content, defaultOpen = false }: { title: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {open
          ? <ChevronUp size={17} className="text-slate-400 shrink-0" />
          : <ChevronDown size={17} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {content.split("\n\n").map((para, i) => {
            const lines = para.split("\n");
            const isList = lines.some((l) => l.startsWith("- "));
            if (isList) {
              return (
                <ul key={i} className="mt-3 space-y-2">
                  {lines.map((line, j) =>
                    line.startsWith("- ") ? (
                      <li key={j} className="flex gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ocean-500 shrink-0" />
                        <span>{line.slice(2)}</span>
                      </li>
                    ) : (
                      line.trim() && <li key={j} className="text-sm text-slate-600">{line}</li>
                    )
                  )}
                </ul>
              );
            }
            // Numbered list detection
            const isNumbered = lines.some((l) => /^\d+\./.test(l));
            if (isNumbered) {
              return (
                <ol key={i} className="mt-3 space-y-2 list-none">
                  {lines.map((line, j) => {
                    const match = line.match(/^(\d+)\.\s+(.*)/);
                    return match ? (
                      <li key={j} className="flex gap-3 text-sm text-slate-600">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                          style={{ background: "#0B7EB8" }}
                        >
                          {match[1]}
                        </span>
                        <span>{match[2]}</span>
                      </li>
                    ) : (
                      line.trim() && <li key={j} className="text-sm text-slate-600 pl-8">{line}</li>
                    );
                  })}
                </ol>
              );
            }
            return (
              <p key={i} className="mt-3 text-sm text-slate-600 leading-relaxed">
                {para}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Help & Support</h1>
          <p className="text-sm text-slate-500 mt-0.5">How to get the most from NautIQ</p>
        </div>
      </div>

      {/* Ask the AI banner */}
      <div
        className="rounded-2xl px-4 py-4 mb-6 flex items-start gap-3"
        style={{ background: "linear-gradient(135deg,#E6F3FA,#C8E4F4)", border: "1px solid #9ECDE8" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(135deg,#15A0D6,#0B7EB8)" }}
        >
          <MessageCircle size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ocean-900">Ask the AI assistant</p>
          <p className="text-xs text-ocean-700 mt-0.5 leading-relaxed">
            You can ask the AI on the Home screen any "how do I" question — it knows the full guide below and will walk you through it.
          </p>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-3">
        {HELP_SECTIONS.map((section, i) => (
          <HelpAccordion
            key={section.id}
            title={section.title}
            content={section.content}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-center">
        <p className="text-sm text-slate-500">
          Still need help? Ask the AI on the{" "}
          <a href="/chat" className="text-ocean-600 font-medium hover:text-ocean-700">
            Home screen
          </a>{" "}
          — it can answer questions about your specific boat.
        </p>
      </div>
    </main>
  );
}
