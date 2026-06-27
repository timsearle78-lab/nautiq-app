"use client";

import { FileDown } from "lucide-react";
import BoatReportButton from "@/components/reports/boat-report-button";

export default function ReportCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-50">
          <FileDown size={16} className="text-ocean-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Boat Summary Report</p>
          <p className="text-xs text-slate-500">Maintenance schedule · Inventory · Recent trips</p>
        </div>
      </div>
      <BoatReportButton label="Download PDF" className="w-full flex items-center justify-center gap-2 rounded-xl btn-primary px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50" />
    </div>
  );
}
