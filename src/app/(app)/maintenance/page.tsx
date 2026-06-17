import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
      return "text-red-700 bg-red-50 border-red-200";
    case "due_soon":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "planned":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "later":
      return "text-neutral-700 bg-neutral-50 border-neutral-200";
    default:
      return "text-neutral-500 bg-neutral-50 border-neutral-200";
  }
}

function timelineBasisLabel(basis: TimelineRow["prediction_basis"]) {
  switch (basis) {
    case "both":
      return "Time + hours";
    case "time":
      return "Time";
    case "hours":
      return "Hours";
    default:
      return "Unknown";
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
      return "text-red-700";
    case "due_soon":
      return "text-amber-700";
    case "ok":
      return "text-green-700";
    default:
      return "text-neutral-500";
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
  return new Date(value).toLocaleDateString();
}

function formatPredictedDue(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatHours(value: number | null, digits = 0) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)} hrs`;
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
  const selectedBoatId = params.boat;
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
      .order("created_at", { ascending: false });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) {
    redirect("/onboarding");
  }

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [{ data: healthData, error: healthError }, { data: timelineData, error: timelineError }] =
    await Promise.all([
      supabase.rpc("get_boat_health", {
        p_boat_id: boat.id,
      }),
      supabase.rpc("get_boat_maintenance_timeline", {
        p_boat_id: boat.id,
        p_horizon_days: selectedHorizon,
      }),
    ]);

  if (healthError) {
    throw new Error(`Failed to load maintenance data: ${healthError.message}`);
  }

  if (timelineError) {
    throw new Error(`Failed to load predictive timeline: ${timelineError.message}`);
  }

  const allHealth = ((healthData ?? []) as HealthRow[]).sort((a, b) => {
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    if (statusCompare !== 0) return statusCompare;

    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });

  const timeline = (timelineData ?? []) as TimelineRow[];

  const timelineByComponent = new Map(
    timeline.map((row) => [row.component_id, row] as const)
  );

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
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance Overview</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Track what is overdue, due soon, and healthy across your boat.
          </p>
        </div>

        <form method="get">
          <input type="hidden" name="status" value={selectedStatus} />
          <input type="hidden" name="horizon" value={selectedHorizon} />
          <select
            name="boat"
            defaultValue={boat.id}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {boats.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="ml-2 rounded-md border px-4 py-2 text-sm"
          >
            Go
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total components</div>
          <div className="mt-2 text-2xl font-semibold">{allHealth.length}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Overdue</div>
          <div className="mt-2 text-2xl font-semibold text-red-700">
            {overdueCount}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Due soon</div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">
            {dueSoonCount}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Healthy</div>
          <div className="mt-2 text-2xl font-semibold text-green-700">
            {okCount}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Predictive Timeline</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Forecast upcoming maintenance based on service intervals and recent usage.
            </p>
          </div>

          <div className="flex gap-2">
            {HORIZONS.map((days) => {
              const href = `/maintenance?boat=${boat.id}&status=${selectedStatus}&horizon=${days}`;
              const active = selectedHorizon === days;

              return (
                <Link
                  key={days}
                  href={href}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    active ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {days}d
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Overdue forecast</div>
            <div className="mt-2 text-2xl font-semibold text-red-700">
              {timelineOverdue.length}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Due soon</div>
            <div className="mt-2 text-2xl font-semibold text-amber-700">
              {timelineDueSoon.length}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">
              Planned in next {selectedHorizon} days
            </div>
            <div className="mt-2 text-2xl font-semibold text-blue-700">
              {timelinePlanned.length}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-neutral-500">Unknown baseline</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-700">
              {timelineUnknown.length}
            </div>
          </div>
        </div>

        {timelinePreview.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No predictive maintenance items are currently forecast.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {timelinePreview.map((row) => (
              <div key={row.component_id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-medium">{row.component_name}</div>
                    <div className="text-sm text-neutral-500">
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

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Predicted due
                    </div>
                    <div className="mt-1 font-medium">
                      {formatDate(row.predicted_due_date)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-neutral-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Due hours
                    </div>
                    <div className="mt-1 font-medium">
                      {formatHours(row.predicted_due_hours)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-neutral-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Hours until due
                    </div>
                    <div className="mt-1 font-medium">
                      {formatHours(row.hours_until_due)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-neutral-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Basis
                    </div>
                    <div className="mt-1 font-medium">
                      {timelineBasisLabel(row.prediction_basis)}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-neutral-600">
                  {row.explanation ?? "No explanation available."}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
                  <span>Last serviced: {formatDate(row.last_serviced_at)}</span>
                  <span>Risk: {Math.round(Number(row.risk_score ?? 0))}</span>
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/components/${row.component_id}`}
                    className="underline"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/components/${row.component_id}#log-maintenance`}
                    className="underline"
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
              ? `/maintenance?boat=${boat.id}&horizon=${selectedHorizon}`
              : `/maintenance?boat=${boat.id}&status=${tab.key}&horizon=${selectedHorizon}`;

          const active = selectedStatus === tab.key;

          return (
            <Link
              key={tab.key}
              href={href}
              className={`rounded-full border px-4 py-2 text-sm ${
                active ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Components
            {selectedStatus !== "all" ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                · {statusLinks.find((s) => s.key === selectedStatus)?.label}
              </span>
            ) : null}
          </h2>

          <Link href={`/dashboard?boat=${boat.id}`} className="text-sm underline">
            Back to dashboard
          </Link>
        </div>

        {filteredHealth.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No components match this filter.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-3 lg:hidden">
              {filteredHealth.map((row) => {
                const timelineItem = timelineByComponent.get(row.component_id);

                return (
                  <div
                    key={row.component_id}
                    className={`rounded-xl border p-4 ${
                      normalizeStatus(row.status) === "overdue"
                        ? "border-red-200 bg-red-50"
                        : normalizeStatus(row.status) === "due_soon"
                        ? "border-amber-200 bg-amber-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.component_name}</div>
                        <div className="text-sm text-neutral-500">
                          {row.system_name ?? "—"}
                        </div>
                        
                         <div
                          className={`text-xs ${
                            normalizeStatus(row.status) === "overdue"
                              ? "text-red-600"
                              : normalizeStatus(row.status) === "due_soon"
                              ? "text-amber-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {maintenanceUrgency(
                            timelineItem?.predicted_due_date ?? null,
                            row.hours_until_due
                          )}
                        </div>
  
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          normalizeStatus(row.status) === "overdue"
                            ? "bg-red-100 text-red-700"
                            : normalizeStatus(row.status) === "due_soon"
                            ? "bg-amber-100 text-amber-700"
                            : normalizeStatus(row.status) === "ok"
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Predicted due</span>
                        <span
                          className={
                            timelineItem?.status === "overdue"
                              ? "font-medium text-red-700"
                              : timelineItem?.status === "due_soon"
                              ? "font-medium text-amber-700"
                              : "font-medium"
                          }
                        >
                          {formatPredictedDue(
                            timelineItem?.predicted_due_date ?? null
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Hours until due</span>
                        <span className="font-medium">
                          {row.hours_until_due != null
                            ? Math.round(row.hours_until_due)
                            : "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Months until due</span>
                        <span className="font-medium">
                          {row.months_until_due != null
                            ? row.months_until_due
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-4 text-sm">
                      <Link
                        href={`/components/${row.component_id}`}
                        className="underline"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/components/${row.component_id}#log-maintenance`}
                        className="underline"
                      >
                        {normalizeStatus(row.status) === "ok"
                          ? "View form"
                          : "Log maintenance"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Component</th>
                    <th className="py-2 pr-4">System</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Risk</th>
                    <th className="py-2 pr-4">Hours since</th>
                    <th className="py-2 pr-4">Hours until due</th>
                    <th className="py-2 pr-4">Months until due</th>
                    <th className="py-2 pr-4">Predicted due</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHealth.map((row) => (
                    <tr
                      key={row.component_id}
                      className={`border-b align-top ${
                        normalizeStatus(row.status) === "overdue"
                          ? "bg-red-50"
                          : normalizeStatus(row.status) === "due_soon"
                          ? "bg-amber-50"
                          : ""
                      }`}
                    >
                      <td className="py-3 pr-4 font-medium">
                        {row.component_name}
                      </td>
                      <td className="py-3 pr-4">{row.system_name ?? "—"}</td>
                      <td
                        className={`py-3 pr-4 font-medium ${statusColor(
                          row.status
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </td>
                      <td className="py-3 pr-4">
                        {Math.round(Number(row.risk_score ?? 0))}
                      </td>
                      <td className="py-3 pr-4">
                        {row.hours_since_service != null
                          ? Math.round(row.hours_since_service)
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {row.hours_until_due != null
                          ? Math.round(row.hours_until_due)
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {row.months_until_due != null
                          ? row.months_until_due
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            timelineByComponent.get(row.component_id)?.status ===
                            "overdue"
                              ? "font-medium text-red-700"
                              : timelineByComponent.get(row.component_id)
                                  ?.status === "due_soon"
                              ? "font-medium text-amber-700"
                              : ""
                          }
                        >
                          {formatPredictedDue(
                            timelineByComponent.get(row.component_id)
                              ?.predicted_due_date ?? null
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/components/${row.component_id}`}
                            className="underline"
                          >
                            Open
                          </Link>

                          <Link
                            href={`/components/${row.component_id}#log-maintenance`}
                            className="underline text-sm"
                          >
                            {normalizeStatus(row.status) === "ok"
                              ? "View form"
                              : "Log maintenance"}
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
      </section>
    </main>
  );
}