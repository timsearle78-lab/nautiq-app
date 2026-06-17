import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ComponentsPageProps = {
  searchParams: Promise<{ boat?: string; status?: string; system?: string }>;
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
type StatusFilter = "all" | "overdue" | "due_soon" | "ok" | "unknown";

function normalizeStatus(status: string | null): StatusFilter {
  const value = (status ?? "").toLowerCase();
  if (value === "overdue") return "overdue";
  if (value === "due soon" || value === "due_soon") return "due_soon";
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

function statusRank(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue": return 0;
    case "due_soon": return 1;
    case "ok": return 2;
    default: return 3;
  }
}

export default async function ComponentsPage({ searchParams }: ComponentsPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;
  const selectedStatus = parseStatusFilter(params.status);
  const selectedSystem = (params.system ?? "").trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/components");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: false });

  if (boatsError) throw new Error(`Failed to load boats: ${boatsError.message}`);

  const boats = (boatsData ?? []) as BoatRow[];
  if (boats.length === 0) redirect("/onboarding");

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const { data: healthData, error: healthError } = await supabase.rpc("get_boat_health", {
    p_boat_id: boat.id,
  });

  if (healthError) throw new Error(`Failed to load component data: ${healthError.message}`);

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
    filteredRows = filteredRows.filter((row) => normalizeStatus(row.status) === selectedStatus);
  }
  if (selectedSystem) {
    filteredRows = filteredRows.filter((row) => (row.system_name ?? "") === selectedSystem);
  }

  const statusLinks: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: allRows.length },
    { key: "overdue", label: "Overdue", count: allRows.filter((r) => normalizeStatus(r.status) === "overdue").length },
    { key: "due_soon", label: "Due soon", count: allRows.filter((r) => normalizeStatus(r.status) === "due_soon").length },
    { key: "ok", label: "Healthy", count: allRows.filter((r) => normalizeStatus(r.status) === "ok").length },
    { key: "unknown", label: "Unknown", count: allRows.filter((r) => normalizeStatus(r.status) === "unknown").length },
  ];

  const pillBase = "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors";
  const pillActive = `${pillBase} bg-ocean-600 text-white`;
  const pillInactive = `${pillBase} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Components</h1>
          <p className="mt-1 text-sm text-slate-500">{boat.name}</p>
        </div>
        <Link
          href={`/components/new?boat=${boat.id}`}
          className="flex-shrink-0 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-medium text-white hover:bg-ocean-700 transition-colors"
        >
          + Add
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statusLinks.map((tab) => {
          const href =
            tab.key === "all"
              ? `/components?boat=${boat.id}${selectedSystem ? `&system=${encodeURIComponent(selectedSystem)}` : ""}`
              : `/components?boat=${boat.id}&status=${tab.key}${selectedSystem ? `&system=${encodeURIComponent(selectedSystem)}` : ""}`;
          return (
            <Link key={tab.key} href={href} className={selectedStatus === tab.key ? pillActive : pillInactive}>
              {tab.label} {tab.count > 0 && <span className="opacity-70">({tab.count})</span>}
            </Link>
          );
        })}
      </div>

      {/* System filter */}
      {systems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/components?boat=${boat.id}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}`}
            className={selectedSystem === "" ? pillActive : pillInactive}
          >
            All systems
          </Link>
          {systems.map((system) => (
            <Link
              key={system}
              href={`/components?boat=${boat.id}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}&system=${encodeURIComponent(system)}`}
              className={selectedSystem === system ? pillActive : pillInactive}
            >
              {system}
            </Link>
          ))}
        </div>
      )}

      {/* Component list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {selectedSystem || "All components"}
          </h2>
        </div>

        {filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No components match this filter.</p>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredRows.map((row) => (
                <Link
                  key={row.component_id}
                  href={`/components/${row.component_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">{row.component_name}</div>
                    <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${statusColor(row.status)}`}>
                    {statusLabel(row.status)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Component</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">System</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs since</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs until due</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
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
