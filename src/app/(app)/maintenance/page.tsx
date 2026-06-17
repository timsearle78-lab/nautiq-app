import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MaintenancePageProps = {
  searchParams: Promise<{ boat?: string; status?: string; horizon?: string }>;
};

type BoatRow = { id: string; name: string; type: string | null; created_at: string };
type HealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  months_until_due: number | null;
};
type TimelineRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  last_serviced_at: string | null;
  last_serviced_hours: number | null;
  interval_months: number | null;
  interval_hours: number | null;
  current_engine_hours: number | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  predicted_due_date: string | null;
  predicted_due_hours: number | null;
  prediction_basis: "time" | "hours" | "both" | "unknown";
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
  risk_score: number | null;
  explanation: string | null;
  sort_date: string | null;
};

type StatusFilter = "all" | "overdue" | "due_soon" | "ok" | "unknown";

const HORIZONS = [30, 90, 180] as const;

function normalizeStatus(status: string | null): StatusFilter {
  const value = (status ?? "").toLowerCase();
  if (value === "overdue") return "overdue";
  if (value === "due soon" || value === "due_soon") return "due_soon";
  if (value === "ok") return "ok";
  return "unknown";
}

function timelineStatusLabel(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue": return "Overdue";
    case "due_soon": return "Due soon";
    case "planned": return "Planned";
    case "later": return "Later";
    default: return "Unknown";
  }
}

function timelineStatusBadge(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue": return "bg-red-50 text-red-600 border-red-200";
    case "due_soon": return "bg-amber-50 text-amber-600 border-amber-200";
    case "planned": return "bg-blue-50 text-blue-600 border-blue-200";
    case "later": return "bg-slate-50 text-slate-600 border-slate-200";
    default: return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

function statusRank(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue": return 0;
    case "due_soon": return 1;
    case "ok": return 2;
    default: return 3;
  }
}

function statusColor(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue": return "text-red-600";
    case "due_soon": return "text-amber-600";
    case "ok": return "text-green-600";
    default: return "text-slate-500";
  }
}

function statusLabel(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue": return "Overdue";
    case "due_soon": return "Due soon";
    case "ok": return "OK";
    default: return "Unknown";
  }
}

function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "overdue") return "overdue";
  if (value === "due_soon") return "due_soon";
  if (value === "ok") return "ok";
  if (value === "unknown") return "unknown";
  return "all";
}

function parseHorizon(value: string | undefined) {
  const parsed = Number(value);
  if (parsed === 30 || parsed === 90 || parsed === 180) return parsed;
  return 90;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatHours(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}h`;
}

function maintenanceUrgency(predictedDate: string | null, hoursUntil: number | null) {
  if (!predictedDate && hoursUntil == null) return "Baseline required";
  if (predictedDate) {
    const diffDays = Math.round((new Date(predictedDate).getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    return `Due in ${diffDays}d`;
  }
  if (hoursUntil != null) {
    if (hoursUntil < 0) return `Overdue by ${Math.abs(Math.round(hoursUntil))}h`;
    return `Due in ${Math.round(hoursUntil)}h`;
  }
  return "Unknown";
}

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;
  const selectedStatus = parseStatusFilter(params.status);
  const selectedHorizon = parseHorizon(params.horizon);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/maintenance");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (boatsError) throw new Error(`Failed to load boats: ${boatsError.message}`);

  const boats = (boatsData ?? []) as BoatRow[];
  if (boats.length === 0) redirect("/onboarding");

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [{ data: healthData, error: healthError }, { data: timelineData, error: timelineError }] =
    await Promise.all([
      supabase.rpc("get_boat_health", { p_boat_id: boat.id }),
      supabase.rpc("get_boat_maintenance_timeline", { p_boat_id: boat.id, p_horizon_days: selectedHorizon }),
    ]);

  if (healthError) throw new Error(`Failed to load maintenance data: ${healthError.message}`);
  if (timelineError) throw new Error(`Failed to load predictive timeline: ${timelineError.message}`);

  const allHealth = ((healthData ?? []) as HealthRow[]).sort((a, b) => {
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    if (statusCompare !== 0) return statusCompare;
    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });

  const timeline = (timelineData ?? []) as TimelineRow[];
  const timelineByComponent = new Map(timeline.map((row) => [row.component_id, row] as const));

  const overdueCount = allHealth.filter((r) => normalizeStatus(r.status) === "overdue").length;
  const dueSoonCount = allHealth.filter((r) => normalizeStatus(r.status) === "due_soon").length;
  const okCount = allHealth.filter((r) => normalizeStatus(r.status) === "ok").length;
  const unknownCount = allHealth.filter((r) => normalizeStatus(r.status) === "unknown").length;

  const filteredHealth =
    selectedStatus === "all"
      ? allHealth
      : allHealth.filter((row) => normalizeStatus(row.status) === selectedStatus);

  const statusLinks: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: allHealth.length },
    { key: "overdue", label: "Overdue", count: overdueCount },
    { key: "due_soon", label: "Due soon", count: dueSoonCount },
    { key: "ok", label: "Healthy", count: okCount },
    { key: "unknown", label: "Unknown", count: unknownCount },
  ];

  const timelineOverdue = timeline.filter((r) => r.status === "overdue");
  const timelineDueSoon = timeline.filter((r) => r.status === "due_soon");
  const timelinePlanned = timeline.filter((r) => r.status === "planned");
  const timelineUnknown = timeline.filter((r) => r.status === "unknown");
  const timelinePreview = [...timelineOverdue, ...timelineDueSoon, ...timelinePlanned].slice(0, 6);

  const pillBase = "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors";
  const pillActive = `${pillBase} bg-ocean-600 text-white`;
  const pillInactive = `${pillBase} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">{boat.name}</p>
        </div>
        {boats.length > 1 && (
          <form method="get" className="flex gap-2 items-center">
            <input type="hidden" name="status" value={selectedStatus} />
            <input type="hidden" name="horizon" value={selectedHorizon} />
            <select
              name="boat"
              defaultValue={boat.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
            >
              {boats.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Switch
            </button>
          </form>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Total</div>
          <div className="mt-1 text-2xl font-semibold text-slate-800">{allHealth.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Overdue</div>
          <div className={`mt-1 text-2xl font-semibold ${overdueCount > 0 ? "text-red-600" : "text-slate-800"}`}>{overdueCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Due soon</div>
          <div className={`mt-1 text-2xl font-semibold ${dueSoonCount > 0 ? "text-amber-600" : "text-slate-800"}`}>{dueSoonCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Healthy</div>
          <div className={`mt-1 text-2xl font-semibold ${okCount > 0 ? "text-green-600" : "text-slate-800"}`}>{okCount}</div>
        </div>
      </div>

      {/* Predictive timeline */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Predictive Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Forecast based on service intervals and engine hours
            </p>
          </div>
          <div className="flex gap-1.5">
            {HORIZONS.map((days) => (
              <Link
                key={days}
                href={`/maintenance?boat=${boat.id}&status=${selectedStatus}&horizon=${days}`}
                className={selectedHorizon === days ? pillActive : pillInactive}
              >
                {days}d
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 p-4 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500">Overdue</div>
            <div className={`text-xl font-semibold mt-1 ${timelineOverdue.length > 0 ? "text-red-600" : "text-slate-800"}`}>{timelineOverdue.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Due soon</div>
            <div className={`text-xl font-semibold mt-1 ${timelineDueSoon.length > 0 ? "text-amber-600" : "text-slate-800"}`}>{timelineDueSoon.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Planned ({selectedHorizon}d)</div>
            <div className="text-xl font-semibold mt-1 text-slate-800">{timelinePlanned.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Unknown baseline</div>
            <div className="text-xl font-semibold mt-1 text-slate-600">{timelineUnknown.length}</div>
          </div>
        </div>

        {timelinePreview.length === 0 ? (
          <p className="px-4 py-5 text-sm text-slate-500">No items forecast in this period.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {timelinePreview.map((row) => (
              <div key={row.component_id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-slate-800">{row.component_name}</div>
                    <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${timelineStatusBadge(row.status)}`}>
                    {timelineStatusLabel(row.status)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-xs text-slate-500">Predicted due</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(row.predicted_due_date)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-xs text-slate-500">Due at hrs</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-800">{formatHours(row.predicted_due_hours)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-xs text-slate-500">Hours until</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-800">{formatHours(row.hours_until_due)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-xs text-slate-500">Last service</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(row.last_serviced_at)}</div>
                  </div>
                </div>

                {row.explanation && (
                  <p className="mt-2 text-xs text-slate-500">{row.explanation}</p>
                )}

                <div className="mt-3 flex gap-3">
                  <Link href={`/components/${row.component_id}`} className="text-sm text-ocean-600 hover:text-ocean-700 font-medium">
                    Open
                  </Link>
                  <Link href={`/components/${row.component_id}#log-maintenance`} className="text-sm text-slate-500 hover:text-slate-700">
                    Log maintenance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusLinks.map((tab) => {
          const href =
            tab.key === "all"
              ? `/maintenance?boat=${boat.id}&horizon=${selectedHorizon}`
              : `/maintenance?boat=${boat.id}&status=${tab.key}&horizon=${selectedHorizon}`;
          return (
            <Link key={tab.key} href={href} className={selectedStatus === tab.key ? pillActive : pillInactive}>
              {tab.label} {tab.count > 0 && <span className="opacity-70">({tab.count})</span>}
            </Link>
          );
        })}
      </div>

      {/* Component list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            Components
            {selectedStatus !== "all" && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                · {statusLinks.find((s) => s.key === selectedStatus)?.label}
              </span>
            )}
          </h2>
        </div>

        {filteredHealth.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No components match this filter.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredHealth.map((row) => {
                const timelineItem = timelineByComponent.get(row.component_id);
                return (
                  <div key={row.component_id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm text-slate-800">{row.component_name}</div>
                        <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                        <div className={`text-xs mt-0.5 font-medium ${statusColor(row.status)}`}>
                          {maintenanceUrgency(timelineItem?.predicted_due_date ?? null, row.hours_until_due)}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        normalizeStatus(row.status) === "overdue" ? "bg-red-50 text-red-600 border-red-200" :
                        normalizeStatus(row.status) === "due_soon" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        normalizeStatus(row.status) === "ok" ? "bg-green-50 text-green-600 border-green-200" :
                        "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-3">
                      <Link href={`/components/${row.component_id}`} className="text-sm text-ocean-600 hover:text-ocean-700 font-medium">
                        Open
                      </Link>
                      <Link href={`/components/${row.component_id}#log-maintenance`} className="text-sm text-slate-500 hover:text-slate-700">
                        Log maintenance
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Component</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">System</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs since</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs until due</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Predicted due</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHealth.map((row) => (
                    <tr key={row.component_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.component_name}</td>
                      <td className="px-4 py-3 text-slate-500">{row.system_name ?? "—"}</td>
                      <td className={`px-4 py-3 font-medium ${statusColor(row.status)}`}>{statusLabel(row.status)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.hours_since_service != null ? Math.round(row.hours_since_service) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.hours_until_due != null ? Math.round(row.hours_until_due) : "—"}
                      </td>
                      <td className={`px-4 py-3 font-medium ${
                        timelineByComponent.get(row.component_id)?.status === "overdue" ? "text-red-600" :
                        timelineByComponent.get(row.component_id)?.status === "due_soon" ? "text-amber-600" : "text-slate-600"
                      }`}>
                        {formatDate(timelineByComponent.get(row.component_id)?.predicted_due_date ?? null)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link href={`/components/${row.component_id}`} className="text-ocean-600 hover:text-ocean-700 font-medium">
                            Open
                          </Link>
                          <Link href={`/components/${row.component_id}#log-maintenance`} className="text-slate-500 hover:text-slate-700">
                            Log
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
