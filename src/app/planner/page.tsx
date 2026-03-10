import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PlannerPageProps = {
  searchParams: Promise<{ boat?: string; horizon?: string }>;
};

type BoatRow = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
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

const HORIZONS = [90, 180, 365] as const;

function parseHorizon(value: string | undefined) {
  const parsed = Number(value);
  if (parsed === 90 || parsed === 180 || parsed === 365) return parsed;
  return 180;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function statusLabel(status: TimelineRow["status"]) {
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

function statusClasses(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "due_soon":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "planned":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "later":
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function basisLabel(basis: TimelineRow["prediction_basis"]) {
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

function groupByMonth(rows: TimelineRow[]) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  });

  const groups = new Map<string, TimelineRow[]>();

  for (const row of rows) {
    if (!row.predicted_due_date) continue;

    const label = formatter.format(new Date(row.predicted_due_date));
    const existing = groups.get(label) ?? [];
    existing.push(row);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => {
      const aTime = a.predicted_due_date
        ? new Date(a.predicted_due_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.predicted_due_date
        ? new Date(b.predicted_due_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }),
  }));
}

export default async function PlannerPage({
  searchParams,
}: PlannerPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;
  const selectedHorizon = parseHorizon(params.horizon);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/planner");

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

  const { data: timelineData, error: timelineError } = await supabase.rpc(
    "get_boat_maintenance_timeline",
    {
      p_boat_id: boat.id,
      p_horizon_days: selectedHorizon,
    }
  );

  if (timelineError) {
    throw new Error(`Failed to load planner data: ${timelineError.message}`);
  }

  const timeline = (timelineData ?? []) as TimelineRow[];

  const plannedRows = timeline.filter(
    (row) =>
      row.status === "overdue" ||
      row.status === "due_soon" ||
      row.status === "planned"
  );

  const grouped = groupByMonth(plannedRows);
  const overdueNow = timeline.filter((row) => row.status === "overdue");
  const unknownRows = timeline.filter((row) => row.status === "unknown");

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance Planner</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Plan upcoming maintenance over the next {selectedHorizon} days.
          </p>
        </div>

        <form method="get" className="flex items-center gap-2">
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

          <input type="hidden" name="horizon" value={selectedHorizon} />

          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm"
          >
            Go
          </button>
        </form>
      </section>

      <section className="flex flex-wrap gap-2">
        {HORIZONS.map((days) => {
          const active = selectedHorizon === days;

          return (
            <Link
              key={days}
              href={`/planner?boat=${boat.id}&horizon=${days}`}
              className={`rounded-full border px-4 py-2 text-sm ${
                active ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {days}d
            </Link>
          );
        })}

        <Link
          href={`/maintenance?boat=${boat.id}`}
          className="rounded-full border px-4 py-2 text-sm"
        >
          Maintenance Overview
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Boat</div>
          <div className="mt-2 text-lg font-semibold">{boat.name}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Overdue now</div>
          <div className="mt-2 text-2xl font-semibold text-red-700">
            {overdueNow.length}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Planned items</div>
          <div className="mt-2 text-2xl font-semibold text-blue-700">
            {plannedRows.length}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Unknown baseline</div>
          <div className="mt-2 text-2xl font-semibold text-neutral-700">
            {unknownRows.length}
          </div>
        </div>
      </section>

      {overdueNow.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Overdue now</h2>
          <div className="mt-4 grid gap-3">
            {overdueNow.map((row) => (
              <div
                key={row.component_id}
                className="rounded-xl border border-red-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-medium">{row.component_name}</div>
                    <div className="text-sm text-neutral-500">
                      {row.system_name ?? "—"}
                    </div>
                  </div>

                  <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    Overdue
                  </span>
                </div>

                <div className="mt-3 text-sm text-neutral-600">
                  {row.explanation ?? "This item is overdue."}
                </div>

                <div className="mt-4 flex gap-3 text-sm">
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
        </section>
      )}

      <section className="space-y-6">
        {grouped.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-neutral-600">
            No planned maintenance items found in the selected horizon.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="rounded-xl border p-4">
              <h2 className="text-lg font-semibold">{group.label}</h2>

              <div className="mt-4 grid gap-3">
                {group.items.map((row) => (
                  <div
                    key={row.component_id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-medium">{row.component_name}</div>
                        <div className="text-sm text-neutral-500">
                          {row.system_name ?? "—"}
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                          row.status
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </span>
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
                          Hours until due
                        </div>
                        <div className="mt-1 font-medium">
                          {row.hours_until_due != null
                            ? Math.round(row.hours_until_due)
                            : "—"}
                        </div>
                      </div>

                      <div className="rounded-lg bg-neutral-50 p-3">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                          Predicted due hours
                        </div>
                        <div className="mt-1 font-medium">
                          {row.predicted_due_hours != null
                            ? Math.round(row.predicted_due_hours)
                            : "—"}
                        </div>
                      </div>

                      <div className="rounded-lg bg-neutral-50 p-3">
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                          Basis
                        </div>
                        <div className="mt-1 font-medium">
                          {basisLabel(row.prediction_basis)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-neutral-600">
                      {row.explanation ?? "No explanation available."}
                    </p>

                    <div className="mt-4 flex gap-3 text-sm">
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
            </div>
          ))
        )}
      </section>

      {unknownRows.length > 0 && (
        <section className="rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Baseline required</h2>
          <p className="mt-1 text-sm text-neutral-600">
            These components need more service history before NautIQ can plan
            them accurately.
          </p>

          <div className="mt-4 grid gap-3">
            {unknownRows.map((row) => (
              <div key={row.component_id} className="rounded-xl border p-4">
                <div className="font-medium">{row.component_name}</div>
                <div className="text-sm text-neutral-500">
                  {row.system_name ?? "—"}
                </div>

                <div className="mt-4">
                  <Link
                    href={`/components/${row.component_id}#log-maintenance`}
                    className="underline text-sm"
                  >
                    Add service baseline
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}