import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";

export const dynamic = "force-dynamic";

type ComponentsPageProps = {
  searchParams: Promise<{ boat?: string; status?: string; system?: string }>;
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

type StatusFilter = "all" | "overdue" | "due_soon" | "ok" | "unknown";

function normalizeStatus(status: string | null): StatusFilter {
  const value = (status ?? "").toLowerCase();

  if (value === "overdue") return "overdue";
  if (value === "due soon") return "due_soon";
  if (value === "ok") return "ok";
  return "unknown";
}

function parseStatusFilter(value: string | undefined): StatusFilter {
  if (value === "overdue") return "overdue";
  if (value === "due_soon") return "due_soon";
  if (value === "ok") return "ok";
  if (value === "unknown") return "unknown";
  return "all";
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

export default async function ComponentsPage({
  searchParams,
}: ComponentsPageProps) {
  noStore();

  const params = await searchParams;
  const selectedStatus = parseStatusFilter(params.status);
  const selectedSystem = (params.system ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/components");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
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

  const healthData = await getBoatHealth(boat.id);

  const allRows = (healthData as HealthRow[]).sort((a, b) => {
    const systemCompare = (a.system_name ?? "").localeCompare(b.system_name ?? "");
    if (systemCompare !== 0) return systemCompare;

    const statusCompare = statusRank(a.status) - statusRank(b.status);
    if (statusCompare !== 0) return statusCompare;

    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });

  const systems = Array.from(
    new Set(allRows.map((row) => row.system_name).filter(Boolean))
  ) as string[];

  let filteredRows = allRows;

  if (selectedStatus !== "all") {
    filteredRows = filteredRows.filter(
      (row) => normalizeStatus(row.status) === selectedStatus
    );
  }

  if (selectedSystem) {
    filteredRows = filteredRows.filter(
      (row) => (row.system_name ?? "") === selectedSystem
    );
  }

  const statusLinks: Array<{
    key: StatusFilter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: allRows.length },
    {
      key: "overdue",
      label: "Overdue",
      count: allRows.filter((r) => normalizeStatus(r.status) === "overdue").length,
    },
    {
      key: "due_soon",
      label: "Due soon",
      count: allRows.filter((r) => normalizeStatus(r.status) === "due_soon").length,
    },
    {
      key: "ok",
      label: "Healthy",
      count: allRows.filter((r) => normalizeStatus(r.status) === "ok").length,
    },
    {
      key: "unknown",
      label: "Unknown",
      count: allRows.filter((r) => normalizeStatus(r.status) === "unknown").length,
    },
  ];

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Components</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse and manage all tracked components for the selected boat.
          </p>
        </div>

        <Link
          href="/components/new"
          className="rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700"
        >
          Add component
        </Link>
      </section>

      <section className="flex flex-wrap gap-2">
        {statusLinks.map((tab) => {
          const href =
            tab.key === "all"
              ? `/components${selectedSystem ? `?system=${encodeURIComponent(selectedSystem)}` : ""}`
              : `/components?status=${tab.key}${selectedSystem ? `&system=${encodeURIComponent(selectedSystem)}` : ""}`;

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

      <section className="flex flex-wrap gap-2">
        <Link
          href={`/components${selectedStatus !== "all" ? `?status=${selectedStatus}` : ""}`}
          className={
            selectedSystem === ""
              ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
              : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          }
        >
          All systems
        </Link>

        {systems.map((system) => {
          const href = `/components?${selectedStatus !== "all" ? `status=${selectedStatus}&` : ""}system=${encodeURIComponent(system)}`;

          return (
            <Link
              key={system}
              href={href}
              className={
                selectedSystem === system
                  ? "rounded-full bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {system}
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">
          Component list
          {selectedSystem ? (
            <span className="ml-2 text-sm font-normal text-slate-500">
              · {selectedSystem}
            </span>
          ) : null}
        </h2>

        {filteredRows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No components match this filter.
          </p>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="mt-4 space-y-3 lg:hidden">
              {filteredRows.map((row) => (
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
                    <div className="min-w-0">
                      <Link href={`/components/${row.component_id}`} className="font-medium text-ocean-600 hover:text-ocean-700">
                        {row.component_name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5">{row.system_name ?? "No system"}</div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
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
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Hrs since service</span>
                      <div className="font-medium text-slate-800">
                        {row.hours_since_service != null ? Math.round(row.hours_since_service) : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Hrs until due</span>
                      <div className="font-medium text-slate-800">
                        {row.hours_until_due != null ? Math.round(row.hours_until_due) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="mt-4 hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Component</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">System</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Risk</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs since</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs until due</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Months until due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.component_id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                      <td className="py-3 pr-4">
                        <Link href={`/components/${row.component_id}`} className="font-medium text-ocean-600 hover:text-ocean-700">
                          {row.component_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{row.system_name ?? "—"}</td>
                      <td className={`py-3 pr-4 font-medium ${statusColor(row.status)}`}>{statusLabel(row.status)}</td>
                      <td className="py-3 pr-4 text-slate-600">{Math.round(Number(row.risk_score ?? 0))}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.hours_since_service != null ? Math.round(row.hours_since_service) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.hours_until_due != null ? Math.round(row.hours_until_due) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {row.months_until_due != null ? row.months_until_due : "—"}
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
