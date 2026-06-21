import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
import { AddComponentSheet } from "@/components/components/add-component-sheet";

export const dynamic = "force-dynamic";

type MaintenancePageProps = {
  searchParams: Promise<{ boat?: string; status?: string; horizon?: string }>;
};

type BoatRow = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
};

type HealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  months_until_due: number | null;
  predicted_due_date: string | null;
};

type TimelineRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  predicted_due_date: string | null;
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
  risk_score: number | null;
};

type StatusFilter = "all" | "overdue" | "due_soon" | "ok" | "unknown";

const HORIZONS = [30, 90, 180] as const;

function normalizeStatus(status: string | null): StatusFilter {
  const value = (status ?? "").toLowerCase();

  if (value === "overdue") return "overdue";
  if (value === "due soon") return "due_soon";
  if (value === "ok") return "ok";
  return "unknown";
}

function timelineStatusLabel(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "planned":
      return "Planned";
    case "later":
      return "Later";
    default:
      return "Unknown";
  }
}

function timelineStatusColor(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue":
      return "text-red-600 bg-red-50 border-red-200";
    case "due_soon":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "planned":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "later":
      return "text-slate-500 bg-slate-50 border-slate-200";
    default:
      return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function statusRank(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue":
      return 0;
    case "due_soon":
      return 1;
    case "ok":
      return 2;
    default:
      return 3;
  }
}

function statusColor(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue":
      return "text-red-600";
    case "due_soon":
      return "text-amber-600";
    case "ok":
      return "text-green-600";
    default:
      return "text-slate-500";
  }
}

function statusLabel(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "ok":
      return "OK";
    default:
      return "Unknown";
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
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatPredictedDue(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function maintenanceUrgency(
  predictedDate: string | null,
  hoursUntil: number | null
) {
  if (!predictedDate && hoursUntil == null) {
    return "Baseline required";
  }

  if (predictedDate) {
    const now = new Date();
    const due = new Date(predictedDate);

    const diffDays = Math.round(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    }

    return `Due in ${diffDays} days`;
  }

  if (hoursUntil != null) {
    if (hoursUntil < 0) {
      return `Overdue by ${Math.abs(Math.round(hoursUntil))} hrs`;
    }

    return `Due in ${Math.round(hoursUntil)} hrs`;
  }

  return "Unknown";
}

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  noStore();

  const params = await searchParams;
  const selectedStatus = parseStatusFilter(params.status);
  const selectedHorizon = parseHorizon(params.horizon);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/maintenance");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) {
    redirect("/onboarding");
  }

  const selectedBoatId = await getSelectedBoatId();
  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const allHealthRaw = await getBoatHealth(boat.id);

  const { data: maintenanceSystemsData } = await supabase
    .from("systems")
    .select("id,name")
    .eq("boat_id", boat.id)
    .order("name");

  const maintenanceSystems = (maintenanceSystemsData ?? []) as { id: string; name: string }[];

  const allHealth = (allHealthRaw as HealthRow[]).sort((a, b) => {
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    if (statusCompare !== 0) return statusCompare;
    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });

  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + selectedHorizon);
  const horizonStr = horizonDate.toISOString().slice(0, 10);
  function toTimelineStatus(row: HealthRow): TimelineRow["status"] {
    const s = normalizeStatus(row.status);
    if (s === "overdue") return "overdue";
    if (s === "due_soon") return "due_soon";
    if (s === "unknown") return "unknown";
    // "ok" — check if predicted_due_date falls within the horizon
    if (row.predicted_due_date && row.predicted_due_date <= horizonStr) return "planned";
    return "later";
  }

  const timeline: TimelineRow[] = allHealth
    .map((row) => ({
      component_id: row.component_id,
      component_name: row.component_name,
      system_name: row.system_name,
      hours_since_service: row.hours_since_service,
      hours_until_due: row.hours_until_due,
      predicted_due_date: row.predicted_due_date,
      status: toTimelineStatus(row),
      risk_score: row.risk_score,
    }))
    .filter((row) => row.status !== "later");

  const overdueCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "overdue"
  ).length;

  const dueSoonCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "due_soon"
  ).length;

  const okCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "ok"
  ).length;

  const unknownCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "unknown"
  ).length;

  const filteredHealth =
    selectedStatus === "all"
      ? allHealth
      : allHealth.filter((row) => normalizeStatus(row.status) === selectedStatus);

  const statusLinks: Array<{
    key: StatusFilter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: allHealth.length },
    { key: "overdue", label: "Overdue", count: overdueCount },
    { key: "due_soon", label: "Due soon", count: dueSoonCount },
    { key: "ok", label: "Healthy", count: okCount },
    { key: "unknown", label: "Unknown", count: unknownCount },
  ];

  const timelineOverdue = timeline.filter((row) => row.status === "overdue");
  const timelineDueSoon = timeline.filter((row) => row.status === "due_soon");
  const timelinePlanned = timeline.filter((row) => row.status === "planned");
  const timelineUnknown = timeline.filter((row) => row.status === "unknown");

  const timelinePreview = [
    ...timelineOverdue,
    ...timelineDueSoon,
    ...timelinePlanned,
  ].slice(0, 6);

  return (
    <main className="px-4 py-6 space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track what is overdue, due soon, and healthy across your boat.
          </p>
          <div className="mt-3 flex gap-2">
            <AddComponentSheet boatId={boat.id} systems={maintenanceSystems} boatType={boat.type ?? undefined} />
            <Link
              href="/components"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              All components
            </Link>
          </div>
        </div>

      </section>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: "#F3F6F9", border: "1px solid #E2E9EF" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#8593A0" }}>Total components</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#46586A", lineHeight: 1.1 }}>{allHealth.length}</div>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: overdueCount > 0 ? "#FDF0F0" : "#F3F6F9", border: `1px solid ${overdueCount > 0 ? "#F8DCDC" : "#E2E9EF"}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: overdueCount > 0 ? "#D83A3A" : "#8593A0" }}>Overdue</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: overdueCount > 0 ? "#D83A3A" : "#46586A", lineHeight: 1.1 }}>{overdueCount}</div>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: dueSoonCount > 0 ? "#FDF8EA" : "#F3F6F9", border: `1px solid ${dueSoonCount > 0 ? "#F3E6C4" : "#E2E9EF"}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: dueSoonCount > 0 ? "#C8841A" : "#8593A0" }}>Due soon</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: dueSoonCount > 0 ? "#C8841A" : "#46586A", lineHeight: 1.1 }}>{dueSoonCount}</div>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: okCount > 0 ? "#EEF8F1" : "#F3F6F9", border: `1px solid ${okCount > 0 ? "#D2EBDB" : "#E2E9EF"}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: okCount > 0 ? "#1D9B55" : "#8593A0" }}>Healthy</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: okCount > 0 ? "#1D9B55" : "#46586A", lineHeight: 1.1 }}>{okCount}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Predictive Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">
              Forecast upcoming maintenance based on service intervals and recent usage.
            </p>
          </div>

          <div className="flex gap-2">
            {HORIZONS.map((days) => {
              const href = `/maintenance?status=${selectedStatus}&horizon=${days}`;
              const active = selectedHorizon === days;

              return (
                <Link
                  key={days}
                  href={href}
                  className={
                    active
                      ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
                      : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  }
                >
                  {days}d
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: timelineOverdue.length > 0 ? "#FDF0F0" : "#F3F6F9", border: `1px solid ${timelineOverdue.length > 0 ? "#F8DCDC" : "#E2E9EF"}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: timelineOverdue.length > 0 ? "#D83A3A" : "#8593A0" }}>Overdue forecast</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: timelineOverdue.length > 0 ? "#D83A3A" : "#46586A", lineHeight: 1.1 }}>{timelineOverdue.length}</div>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: timelineDueSoon.length > 0 ? "#FDF8EA" : "#F3F6F9", border: `1px solid ${timelineDueSoon.length > 0 ? "#F3E6C4" : "#E2E9EF"}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: timelineDueSoon.length > 0 ? "#C8841A" : "#8593A0" }}>Due soon</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: timelineDueSoon.length > 0 ? "#C8841A" : "#46586A", lineHeight: 1.1 }}>{timelineDueSoon.length}</div>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: timelinePlanned.length > 0 ? "#E6F3FA" : "#F3F6F9", border: `1px solid ${timelinePlanned.length > 0 ? "#BCDCEE" : "#E2E9EF"}` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: timelinePlanned.length > 0 ? "#0B7EB8" : "#8593A0" }}>Planned · {selectedHorizon}d</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: timelinePlanned.length > 0 ? "#0B7EB8" : "#46586A", lineHeight: 1.1 }}>{timelinePlanned.length}</div>
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: "#F3F6F9", border: "1px solid #E2E9EF" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#8593A0" }}>Unknown baseline</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#46586A", lineHeight: 1.1 }}>{timelineUnknown.length}</div>
          </div>
        </div>

        {timelinePreview.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No predictive maintenance items are currently forecast.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {timelinePreview.map((row) => (
              <div key={row.component_id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{row.component_name}</div>
                    <div className="text-sm text-slate-500">
                      {row.system_name ?? "—"}
                    </div>
                  </div>

                  <div
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${timelineStatusColor(
                      row.status
                    )}`}
                  >
                    {timelineStatusLabel(row.status)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Predicted due
                    </div>
                    <div className="mt-1 font-medium text-slate-800">
                      {formatDate(row.predicted_due_date)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Hours since service
                    </div>
                    <div className="mt-1 font-medium text-slate-800">
                      {row.hours_since_service != null ? Math.round(row.hours_since_service) : "—"}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Hours until due
                    </div>
                    <div className="mt-1 font-medium text-slate-800">
                      {row.hours_until_due != null ? Math.round(row.hours_until_due) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Risk: {Math.round(Number(row.risk_score ?? 0))}</span>
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/components/${row.component_id}`}
                    className="text-ocean-600 hover:text-ocean-700 font-medium text-sm"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/components/${row.component_id}#log-maintenance`}
                    className="text-slate-500 hover:text-slate-700 text-sm"
                  >
                    Log maintenance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {statusLinks.map((tab) => {
          const href =
            tab.key === "all"
              ? `/maintenance?horizon=${selectedHorizon}`
              : `/maintenance?status=${tab.key}&horizon=${selectedHorizon}`;

          const active = selectedStatus === tab.key;

          return (
            <Link
              key={tab.key}
              href={href}
              className={
                active
                  ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Components
          {selectedStatus !== "all" ? (
            <span className="ml-2 text-sm font-normal text-slate-500">
              · {statusLinks.find((s) => s.key === selectedStatus)?.label}
            </span>
          ) : null}
        </h2>

        {filteredHealth.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No components match this filter.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-3 lg:hidden">
              {filteredHealth.map((row) => {
                return (
                  <div
                    key={row.component_id}
                    className={`rounded-xl border p-4 ${
                      normalizeStatus(row.status) === "overdue"
                        ? "border-red-200 bg-red-50"
                        : normalizeStatus(row.status) === "due_soon"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/components/${row.component_id}`} className="font-medium text-ocean-600 hover:text-ocean-700">
                          {row.component_name}
                        </Link>
                        <div className="text-sm text-slate-500">
                          {row.system_name ?? "—"}
                        </div>

                        <div
                          className={`text-xs ${
                            normalizeStatus(row.status) === "overdue"
                              ? "text-red-600"
                              : normalizeStatus(row.status) === "due_soon"
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        >
                          {maintenanceUrgency(row.predicted_due_date ?? null, row.hours_until_due)}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
                          normalizeStatus(row.status) === "overdue"
                            ? "text-red-600 bg-red-50 border-red-200"
                            : normalizeStatus(row.status) === "due_soon"
                            ? "text-amber-600 bg-amber-50 border-amber-200"
                            : normalizeStatus(row.status) === "ok"
                            ? "text-green-600 bg-green-50 border-green-200"
                            : "text-slate-500 bg-slate-50 border-slate-200"
                        }`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Predicted due</span>
                        <span
                          className={
                            normalizeStatus(row.status) === "overdue"
                              ? "font-medium text-red-600"
                              : normalizeStatus(row.status) === "due_soon"
                              ? "font-medium text-amber-600"
                              : "font-medium text-slate-800"
                          }
                        >
                          {formatPredictedDue(row.predicted_due_date ?? null)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Hours until due</span>
                        <span className="font-medium text-slate-800">
                          {row.hours_until_due != null
                            ? Math.round(row.hours_until_due)
                            : "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Months until due</span>
                        <span className="font-medium text-slate-800">
                          {row.months_until_due != null
                            ? row.months_until_due
                            : "—"}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="mt-4 hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Component</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">System</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Risk</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Hours since</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Hours until due</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Months until due</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Predicted due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHealth.map((row) => (
                    <tr
                      key={row.component_id}
                      className="border-b border-slate-100 hover:bg-slate-50 align-top"
                    >
                      <td className="py-3 pr-4">
                        <Link href={`/components/${row.component_id}`} className="font-medium text-ocean-600 hover:text-ocean-700">
                          {row.component_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{row.system_name ?? "—"}</td>
                      <td
                        className={`py-3 pr-4 font-medium ${statusColor(
                          row.status
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {Math.round(Number(row.risk_score ?? 0))}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.hours_since_service != null
                          ? Math.round(row.hours_since_service)
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.hours_until_due != null
                          ? Math.round(row.hours_until_due)
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.months_until_due != null
                          ? row.months_until_due
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            normalizeStatus(row.status) === "overdue"
                              ? "font-medium text-red-600"
                              : normalizeStatus(row.status) === "due_soon"
                              ? "font-medium text-amber-600"
                              : "text-slate-600"
                          }
                        >
                          {formatPredictedDue(row.predicted_due_date ?? null)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
