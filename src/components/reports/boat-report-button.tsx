"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import NautiqSpinner from "@/components/ui/nautiq-spinner";

export default function BoatReportButton({
  className,
  label = "Download Boat Report",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const { generateBoatPdf } = await import("@/lib/reports/generate-boat-pdf");
      await generateBoatPdf();
    } catch (err) {
      setError("Failed to generate report. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {loading && <NautiqSpinner overlay />}
      <button
        onClick={handleClick}
        disabled={loading}
        className={className ?? "w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"}
      >
        <FileDown size={18} className="text-ocean-600 shrink-0" />
        {label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
