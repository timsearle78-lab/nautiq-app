import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getUser, getUserBoats } from "@/lib/supabase/cached-queries";
import { SpendByMonthChart } from "@/components/costs/spend-by-month-chart";
import { SpendByCategoryChart, type CategorySlice } from "@/components/costs/spend-by-category-chart";
import { SortableTh, sortHref } from "@/components/ui/sortable-th";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

type YearRow = {
  year: number;
  maintenance: number;
  parts: number;
  total: number;
};

type CostsPageProps = {
  searchParams: Promise<{
    ysort?: string; ydir?: string;
    msort?: string; mdir?: string;
    psort?: string; pdir?: string;
  }>;
};

export default async function CostsPage({ searchParams }: CostsPageProps) {
  noStore();

  const sp = await searchParams;
  const ysort = sp.ysort ?? null;
  const ydir = (sp.ydir === "asc" || sp.ydir === "desc" ? sp.ydir : null) as "asc" | "desc" | null;
  const msort = sp.msort ?? null;
  const mdir = (sp.mdir === "asc" || sp.mdir === "desc" ? sp.mdir : null) as "asc" | "desc" | null;
  const psort = sp.psort ?? null;
  const pdir = (sp.pdir === "asc" || sp.pdir === "desc" ? sp.pdir : null) as "asc" | "desc" | null;

  const [user, boatsData, selectedBoatId, supabase] = await Promise.all([
    getUser(),
    getUserBoats(),
    getSelectedBoatId(),
    createClient(),
  ]);

  if (!user) redirect("/login");

  const boatList = boatsData as { id: string; name: string }[];
  const boat = boatList.find((b) => b.id === selectedBoatId) ?? boatList[0];
  if (!boat) redirect("/onboarding");

  // Get component IDs for this boat to filter maintenance events correctly
  const { data: boatComponentIds } = await supabase
    .from("components")
    .select("id")
    .eq("boat_id", boat.id);
  const componentIds = (boatComponentIds ?? []).map((c: { id: string }) => c.id);

  const [{ data: maintenanceData }, { data: partsData }] = await Promise.all([
    componentIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase
          .from("maintenance_events")
          .select("performed_at, cost, component:components!inner(name, system:systems(name))")
          .in("component_id", componentIds)
          .not("cost", "is", null)
          .order("performed_at", { ascending: false })
          .limit(1000),
    supabase
      .from("inventory_transactions")
      .select("created_at, cost, notes, inventory_item:inventory_items(name, category)")
      .eq("boat_id", boat.id)
      .eq("transaction_type", "add")
      .not("cost", "is", null)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  type MRow = {
    performed_at: string | null;
    cost: number | null;
    component: { name: string; system: { name: string }[] | { name: string } | null } | { name: string; system: { name: string }[] | { name: string } | null }[] | null;
  };
  type PRow = {
    created_at: string;
    cost: number | null;
    notes: string | null;
    inventory_item: { name: string; category: string | null } | { name: string; category: string | null }[] | null;
  };

  const mRows = (maintenanceData ?? []) as MRow[];
  const pRows = (partsData ?? []) as PRow[];

  // Build year-by-year summary
  const yearMap = new Map<number, { maintenance: number; parts: number }>();

  for (const r of mRows) {
    if (!r.cost || !r.performed_at) continue;
    const y = new Date(r.performed_at).getFullYear();
    const entry = yearMap.get(y) ?? { maintenance: 0, parts: 0 };
    entry.maintenance += Number(r.cost);
    yearMap.set(y, entry);
  }
  for (const r of pRows) {
    if (!r.cost) continue;
    const y = new Date(r.created_at).getFullYear();
    const entry = yearMap.get(y) ?? { maintenance: 0, parts: 0 };
    entry.parts += Number(r.cost);
    yearMap.set(y, entry);
  }

  const yearsBase: YearRow[] = Array.from(yearMap.entries())
    .map(([year, { maintenance, parts }]) => ({ year, maintenance, parts, total: maintenance + parts }))
    .sort((a, b) => b.year - a.year);

  const years: YearRow[] = ysort ? [...yearsBase].sort((a, b) => {
    const mul = ydir === "desc" ? -1 : 1;
    switch (ysort) {
      case "year": return mul * (a.year - b.year);
      case "maintenance": return mul * (a.maintenance - b.maintenance);
      case "parts": return mul * (a.parts - b.parts);
      case "total": return mul * (a.total - b.total);
      default: return 0;
    }
  }) : yearsBase;

  const totalMaintenance = mRows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const totalParts = pRows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const grandTotal = totalMaintenance + totalParts;

  const hasData = grandTotal > 0;

  // Build last 6 months of bars for the column chart
  const now = new Date();
  const monthBars = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-NZ", { month: "short" }).slice(0, 3);
    const isCurrent = i === 5;
    return { key, label, isCurrent, maintenance: 0, parts: 0 };
  });
  const monthMap = new Map(monthBars.map((b) => [b.key, b]));
  for (const r of mRows) {
    if (!r.cost || !r.performed_at) continue;
    const d = new Date(r.performed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bar = monthMap.get(key);
    if (bar) bar.maintenance += Number(r.cost);
  }
  for (const r of pRows) {
    if (!r.cost) continue;
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bar = monthMap.get(key);
    if (bar) bar.parts += Number(r.cost);
  }

  // Build category slices for the pie chart
  // Maintenance: group by system name; Parts: group by inventory category
  const categoryMap = new Map<string, number>();
  for (const r of mRows) {
    if (!r.cost) continue;
    const comp = Array.isArray(r.component) ? r.component[0] : r.component;
    const sys = comp?.system;
    const sysName = sys ? (Array.isArray(sys) ? sys[0]?.name : sys?.name) : null;
    const key = sysName ?? "Maintenance";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + Number(r.cost));
  }
  for (const r of pRows) {
    if (!r.cost) continue;
    const inv = Array.isArray(r.inventory_item) ? r.inventory_item[0] : r.inventory_item;
    const key = inv?.category ?? "Parts";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + Number(r.cost));
  }
  const categorySlices: CategorySlice[] = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  function getComponentName(row: MRow): string {
    if (!row.component) return "Unknown";
    const c = Array.isArray(row.component) ? row.component[0] : row.component;
    if (!c) return "Unknown";
    return c.name;
  }

  function getItemName(row: PRow): string {
    if (!row.inventory_item) return "Unknown item";
    const i = Array.isArray(row.inventory_item) ? row.inventory_item[0] : row.inventory_item;
    return i?.name ?? "Unknown item";
  }

  const sortedMRows: typeof mRows = msort ? [...mRows].sort((a, b) => {
    const mul = mdir === "desc" ? -1 : 1;
    switch (msort) {
      case "date": return mul * ((a.performed_at ?? "").localeCompare(b.performed_at ?? ""));
      case "component": return mul * getComponentName(a).localeCompare(getComponentName(b));
      case "cost": return mul * (Number(a.cost ?? 0) - Number(b.cost ?? 0));
      default: return 0;
    }
  }) : mRows;

  const sortedPRows: typeof pRows = psort ? [...pRows].sort((a, b) => {
    const mul = pdir === "desc" ? -1 : 1;
    switch (psort) {
      case "date": return mul * a.created_at.localeCompare(b.created_at);
      case "item": return mul * getItemName(a).localeCompare(getItemName(b));
      case "cost": return mul * (Number(a.cost ?? 0) - Number(b.cost ?? 0));
      default: return 0;
    }
  }) : pRows;

  return (
    <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href="/chat" className="text-sm text-slate-500 hover:text-ocean-600">
          ← Back
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Cost tracker</h1>
        <p className="mt-1 text-sm text-slate-500">{boat.name} — total cost of ownership</p>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-10 text-center">
          <div className="text-3xl mb-3">💰</div>
          <h2 className="text-base font-semibold text-slate-800">No costs recorded yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
            Add a cost when logging maintenance or restocking inventory — it'll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Total summary tiles */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">Total spend</div>
              <div className="text-xl font-bold text-slate-900">{fmt(grandTotal)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">Maintenance</div>
              <div className="text-xl font-bold text-ocean-600">{fmt(totalMaintenance)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center">
              <div className="text-xs text-slate-500 mb-1">Parts</div>
              <div className="text-xl font-bold text-green-600">{fmt(totalParts)}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-3">
            <SpendByMonthChart bars={monthBars} />
            <SpendByCategoryChart slices={categorySlices} />
          </div>

          {/* Year-by-year breakdown */}
          {years.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800">By year</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {(["year","maintenance","parts","total"] as const).map((col) => (
                      <SortableTh key={col} href={sortHref("/costs", {}, col, ysort, ydir, "ysort", "ydir")} label={col.charAt(0).toUpperCase()+col.slice(1)} active={ysort===col} dir={ysort===col?ydir:null} className={col==="year" ? "text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" : "text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"} />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {years.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{y.year}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{y.maintenance > 0 ? fmt(y.maintenance) : "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{y.parts > 0 ? fmt(y.parts) : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(y.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent maintenance costs */}
          {mRows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800">Maintenance costs</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <SortableTh href={sortHref("/costs",{}, "date", msort, mdir, "msort", "mdir")} label="Date" active={msort==="date"} dir={msort==="date"?mdir:null} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                    <SortableTh href={sortHref("/costs",{}, "component", msort, mdir, "msort", "mdir")} label="Component" active={msort==="component"} dir={msort==="component"?mdir:null} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                    <SortableTh href={sortHref("/costs",{}, "cost", msort, mdir, "msort", "mdir")} label="Cost" active={msort==="cost"} dir={msort==="cost"?mdir:null} className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {r.performed_at ? new Date(r.performed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{getComponentName(r)}</td>
                      <td className="px-4 py-3 text-right font-medium text-ocean-700">{fmt(Number(r.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent parts costs */}
          {pRows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800">Parts & inventory purchases</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <SortableTh href={sortHref("/costs",{}, "date", psort, pdir, "psort", "pdir")} label="Date" active={psort==="date"} dir={psort==="date"?pdir:null} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                    <SortableTh href={sortHref("/costs",{}, "item", psort, pdir, "psort", "pdir")} label="Item" active={psort==="item"} dir={psort==="item"?pdir:null} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                    <SortableTh href={sortHref("/costs",{}, "cost", psort, pdir, "psort", "pdir")} label="Cost" active={psort==="cost"} dir={psort==="cost"?pdir:null} className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{getItemName(r)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(Number(r.cost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
