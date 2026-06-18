"use client";

import Link from "next/link";

// ── Maintenance list ────────────────────────────────────────────────────────

type MaintenanceItem = {
  component: string;
  system: string | null;
  status: string | null;
  monthsUntilDue: number | null;
  hoursUntilDue: number | null;
  riskScore: number | null;
};

function statusPill(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "overdue") return "text-red-600 bg-red-50 border-red-200";
  if (s === "due soon") return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-500 bg-slate-50 border-slate-200";
}

function statusLabel(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "overdue") return "Overdue";
  if (s === "due soon") return "Due soon";
  return status ?? "—";
}

export function MaintenanceListCard({ items }: { items: MaintenanceItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        ✓ No overdue or due-soon maintenance items.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-800">Maintenance needed</span>
        <Link href="/maintenance" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">View all →</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{item.component}</div>
              {item.system && <div className="text-xs text-slate-500">{item.system}</div>}
              {(item.monthsUntilDue != null || item.hoursUntilDue != null) && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {item.monthsUntilDue != null && `${Math.abs(item.monthsUntilDue)}mo `}
                  {item.hoursUntilDue != null && `${Math.abs(Math.round(item.hoursUntilDue))}h`}
                  {(item.monthsUntilDue != null && item.monthsUntilDue < 0) ||
                   (item.hoursUntilDue != null && item.hoursUntilDue < 0)
                    ? " overdue" : " remaining"}
                </div>
              )}
            </div>
            <span className={`flex-shrink-0 text-xs font-medium rounded-full border px-2.5 py-0.5 ${statusPill(item.status)}`}>
              {statusLabel(item.status)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Inventory list ──────────────────────────────────────────────────────────

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
  status: "missing" | "low" | "ok";
  isCritical: boolean;
};

function invStatusPill(status: string) {
  if (status === "missing") return "text-red-600 bg-red-50 border-red-200";
  if (status === "low") return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-green-600 bg-green-50 border-green-200";
}

export function InventoryListCard({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        No inventory items found.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-800">Inventory</span>
        <Link href="/inventory" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">View all →</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                {item.isCritical && (
                  <span className="text-xs text-red-500 font-medium">critical</span>
                )}
              </div>
              <div className="text-xs text-slate-500">{item.category}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-semibold text-slate-700">{item.quantity}</span>
              <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${invStatusPill(item.status)}`}>
                {item.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Trip history ────────────────────────────────────────────────────────────

type TripItem = {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  engineHours: number | null;
  fuelLitres: number | null;
  notes: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function TripHistoryCard({ trips }: { trips: TripItem[] }) {
  if (trips.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        No trips logged yet.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-800">Trip history</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {trips.map((trip) => {
          const date = fmtDate(trip.startedAt);
          const start = fmtTime(trip.startedAt);
          const end = fmtTime(trip.endedAt);
          return (
            <li key={trip.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {date ?? "Unknown date"}
                    {(start || end) && (
                      <span className="ml-2 text-slate-500 font-normal">
                        {start ?? "?"}
                        {end ? ` – ${end}` : ""}
                      </span>
                    )}
                  </div>
                  {trip.notes && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{trip.notes}</div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right text-xs text-slate-500 space-y-0.5">
                  {trip.engineHours != null && <div>{trip.engineHours}h engine</div>}
                  {trip.fuelLitres != null && <div>{trip.fuelLitres}L fuel</div>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Boat summary ────────────────────────────────────────────────────────────

type BoatSummary = {
  boatName: string;
  engineHours: number;
  healthScore: number;
  overdueCount: number;
  dueSoonCount: number;
  urgentItems: string[];
};

export function BoatSummaryCard({ summary }: { summary: BoatSummary }) {
  const isRed = summary.overdueCount > 0 || summary.healthScore < 50;
  const isAmber = !isRed && summary.healthScore < 75;
  const scoreColor = isRed ? "text-red-600" : isAmber ? "text-amber-600" : "text-green-600";
  const scoreBorder = isRed ? "border-red-200 bg-red-50" : isAmber ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50";

  return (
    <div className={`mt-2 rounded-xl border px-4 py-3 ${scoreBorder}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium">Health score</div>
          <div className={`text-3xl font-bold ${scoreColor}`}>{summary.healthScore}</div>
          <div className="text-xs text-slate-400">out of 100</div>
        </div>
        <div className="text-right text-sm space-y-1">
          <div className="text-red-600 font-semibold">{summary.overdueCount} overdue</div>
          <div className="text-amber-600 font-semibold">{summary.dueSoonCount} due soon</div>
          <div className="text-slate-500">{summary.engineHours}h engine</div>
        </div>
      </div>
      {summary.urgentItems.length > 0 && (
        <ul className="mt-3 space-y-1">
          {summary.urgentItems.map((item) => (
            <li key={item} className="text-xs text-red-700">• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
