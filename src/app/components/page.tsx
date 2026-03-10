import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const selectedBoatId = params.boat;
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
    .order("created_at", { ascending: false });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) {
    redirect("/onboarding");
  }

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const { data: healthData, error: healthError } = await supabase.rpc(
    "get_boat_health",
    {
      p_boat_id: boat.id,
    }
  );

  if (healthError) {
    throw new Error(`Failed to load component data: ${healthError.message}`);
  }

  const allRows = ((healthData ?? []) as HealthRow[]).sort((a, b) => {
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
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Components</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Browse and manage all tracked components for the selected boat.
          </p>
        </div>

        <form method="get" className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={selectedStatus} />
          <input type="hidden" name="system" value={selectedSystem} />

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
            className="rounded-md border px-4 py-2 text-sm"
          >
            Go
          </button>
        </form>
        
        <Link
          href={`/components/new?boat=${boat.id}`}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Add component
        </Link>        
      </section>

      <section className="flex flex-wrap gap-2">
        {statusLinks.map((tab) => {
          const href =
            tab.key === "all"
              ? `/components?boat=${boat.id}${selectedSystem ? `&system=${encodeURIComponent(selectedSystem)}` : ""}`
              : `/components?boat=${boat.id}&status=${tab.key}${selectedSystem ? `&system=${encodeURIComponent(selectedSystem)}` : ""}`;

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

      <section className="flex flex-wrap gap-2">
        <Link
          href={`/components?boat=${boat.id}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}`}
          className={`rounded-full border px-4 py-2 text-sm ${
            selectedSystem === "" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          All systems
        </Link>

        {systems.map((system) => {
          const href = `/components?boat=${boat.id}${
            selectedStatus !== "all" ? `&status=${selectedStatus}` : ""
          }&system=${encodeURIComponent(system)}`;

          return (
            <Link
              key={system}
              href={href}
              className={`rounded-full border px-4 py-2 text-sm ${
                selectedSystem === system ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              {system}
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Component list
            {selectedSystem ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                · {selectedSystem}
              </span>
            ) : null}
          </h2>

          <Link
            href={`/maintenance?boat=${boat.id}`}
            className="text-sm underline"
          >
            Maintenance overview
          </Link>
        </div>

        {filteredRows.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No components match this filter.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
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
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
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
                    <td className="py-3 pr-4">
                      {row.system_name ?? "—"}
                    </td>
                    <td className={`py-3 pr-4 font-medium ${statusColor(row.status)}`}>
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
                      {row.months_until_due != null ? row.months_until_due : "—"}
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
                          Log maintenance
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}