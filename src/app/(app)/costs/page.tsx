import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";

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

export default async function CostsPage() {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [selectedBoatId, { data: boats }] = await Promise.all([
    getSelectedBoatId(),
    supabase.from("boats").select("id, name").eq("user_id", user.id).order("created_at", { ascending: true }),
  ]);

  const boatList = boats ?? [];
  const boat = boatList.find((b) => b.id === selectedBoatId) ?? boatList[0];
  if (!boat) redirect("/onboarding");

  const [{ data: maintenanceData }, { data: partsData }] = await Promise.all([
    supabase
      .from("maintenance_events")
      .select("performed_at, cost, component:components(name, system:systems(name))")
      .eq("boat_id", boat.id)
      .not("cost", "is", null)
      .order("performed_at", { ascending: false }),
    supabase
      .from("inventory_transactions")
      .select("created_at, cost, notes, inventory_item:inventory_items(name, category)")
      .eq("boat_id", boat.id)
      .eq("transaction_type", "add")
      .not("cost", "is", null)
      .order("created_at", { ascending: false }),
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

  const years: YearRow[] = Array.from(yearMap.entries())
    .map(([year, { maintenance, parts }]) => ({ year, maintenance, parts, total: maintenance + parts }))
    .sort((a, b) => b.year - a.year);

  const totalMaintenance = mRows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const totalParts = pRows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const grandTotal = totalMaintenance + totalParts;

  const hasData = grandTotal > 0;

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
              <div className="text-xl font-bold text-emerald-600">{fmt(totalParts)}</div>
            </div>
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
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Year</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Maintenance</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parts</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
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
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Component</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mRows.map((r, i) => (
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
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{getItemName(r)}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">{fmt(Number(r.cost))}</td>
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
