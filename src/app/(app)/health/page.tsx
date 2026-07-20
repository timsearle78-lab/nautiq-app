export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { AlertTriangle, CheckCircle, Clock, HelpCircle, Package, ShieldAlert } from "lucide-react";
import { HealthGauge } from "@/components/ui/health-gauge";

type BoatRow = { id: string; name: string; type: string | null };

type InventoryIssue = {
  id: string;
  name: string;
  issue: "out_of_stock" | "low_stock" | "expired" | "expiring_soon";
  is_critical: boolean;
  quantity: number;
  minimum_quantity: number | null;
  unit: string | null;
  expiry_date: string | null;
  component_name: string | null;
};

function normalizeStatus(s: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "overdue") return "overdue";
  if (v === "due soon" || v === "due_soon") return "due_soon";
  if (v === "ok") return "ok";
  return "unknown";
}

function formatDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function issueLabel(issue: InventoryIssue): { text: string; cls: string } {
  if (issue.issue === "expired") return { text: "Expired", cls: "bg-red-50 text-red-600 border-red-200" };
  if (issue.issue === "out_of_stock") return { text: issue.is_critical ? "Out of stock (critical)" : "Out of stock", cls: "bg-red-50 text-red-600 border-red-200" };
  if (issue.issue === "expiring_soon") {
    const expiry = new Date(issue.expiry_date!); expiry.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    return { text: days <= 0 ? "Expires today" : `Expires in ${days}d`, cls: "bg-amber-50 text-amber-600 border-amber-200" };
  }
  // low_stock
  return { text: issue.is_critical ? "Low stock (critical)" : "Low stock", cls: "bg-amber-50 text-amber-600 border-amber-200" };
}

function recommendation(issue: InventoryIssue): string {
  if (issue.issue === "expired") return `Replace expired ${issue.name}`;
  if (issue.issue === "expiring_soon") return `Replace ${issue.name} before it expires`;
  if (issue.issue === "out_of_stock") return `Restock ${issue.name} — ${issue.is_critical ? "critical spare, zero on hand" : "currently out of stock"}`;
  // low_stock
  const min = issue.minimum_quantity ?? 0;
  const unit = issue.unit ? ` ${issue.unit}` : "";
  return `Top up ${issue.name} — ${issue.quantity}${unit} on hand, minimum is ${min}${unit}`;
}

export default async function HealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: boatsData } = await supabase
    .from("boats")
    .select("id,name,type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const boats = (boatsData ?? []) as BoatRow[];
  if (boats.length === 0) redirect("/onboarding");

  const selectedBoatId = await getSelectedBoatId();
  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [health, engineHoursRes, inventoryRes, componentsRes] = await Promise.all([
    getBoatHealth(boat.id),
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
    supabase
      .from("inventory_items")
      .select("id, name, quantity, minimum_quantity, unit, is_critical, expiry_date, component_id")
      .eq("boat_id", boat.id),
    supabase.from("components").select("id, name").eq("boat_id", boat.id),
  ]);

  const engineHours = (engineHoursRes.data as number) ?? 0;

  type InvRow = { id: string; name: string; quantity: number; minimum_quantity: number | null; unit: string | null; is_critical: boolean; expiry_date: string | null; component_id: string | null };
  const inventoryItems = (inventoryRes.data ?? []) as InvRow[];
  const componentNameMap = new Map<string, string>(
    ((componentsRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in90Days = new Date(today); in90Days.setDate(in90Days.getDate() + 90);

  const inventoryIssues: InventoryIssue[] = [];
  for (const item of inventoryItems) {
    const qty = Number(item.quantity ?? 0);
    const min = Number(item.minimum_quantity ?? 0);
    const component_name = item.component_id ? (componentNameMap.get(item.component_id) ?? null) : null;

    // Expiry issues first (most important)
    if (item.expiry_date) {
      const expiry = new Date(item.expiry_date); expiry.setHours(0, 0, 0, 0);
      if (expiry < today) {
        inventoryIssues.push({ id: item.id, name: item.name, issue: "expired", is_critical: item.is_critical, quantity: qty, minimum_quantity: item.minimum_quantity, unit: item.unit, expiry_date: item.expiry_date, component_name });
        continue;
      }
      if (expiry <= in90Days) {
        inventoryIssues.push({ id: item.id, name: item.name, issue: "expiring_soon", is_critical: item.is_critical, quantity: qty, minimum_quantity: item.minimum_quantity, unit: item.unit, expiry_date: item.expiry_date, component_name });
        continue;
      }
    }

    // Stock issues
    if (min > 0 && qty === 0) {
      inventoryIssues.push({ id: item.id, name: item.name, issue: "out_of_stock", is_critical: item.is_critical, quantity: qty, minimum_quantity: item.minimum_quantity, unit: item.unit, expiry_date: item.expiry_date, component_name });
    } else if (min > 0 && qty < min) {
      inventoryIssues.push({ id: item.id, name: item.name, issue: "low_stock", is_critical: item.is_critical, quantity: qty, minimum_quantity: item.minimum_quantity, unit: item.unit, expiry_date: item.expiry_date, component_name });
    }
  }

  // Sort: expired/out_of_stock critical first, then by severity
  const severityRank = { expired: 0, out_of_stock: 1, expiring_soon: 2, low_stock: 3 };
  inventoryIssues.sort((a, b) => {
    const aSev = severityRank[a.issue] + (a.is_critical ? 0 : 0.5);
    const bSev = severityRank[b.issue] + (b.is_critical ? 0 : 0.5);
    return aSev - bSev;
  });

  // Filter out synthetic __inventory__ row from component list display
  const realHealth = health.filter((r) => r.component_id !== "__inventory__");

  const overdue = realHealth.filter((r) => normalizeStatus(r.status) === "overdue");
  const dueSoon = realHealth.filter((r) => normalizeStatus(r.status) === "due_soon");
  const ok = realHealth.filter((r) => normalizeStatus(r.status) === "ok");

  const knownHealth = health.filter((r) => r.risk_score != null);
  const avgRisk = knownHealth.length > 0
    ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
    : 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));

  const hasIssues = overdue.length > 0 || dueSoon.length > 0 || inventoryIssues.length > 0;

  // Build plain-language score explanation
  const scoreReasons: string[] = [];
  if (overdue.length > 0) scoreReasons.push(`${overdue.length} overdue maintenance item${overdue.length !== 1 ? "s" : ""}`);
  if (dueSoon.length > 0) scoreReasons.push(`${dueSoon.length} item${dueSoon.length !== 1 ? "s" : ""} due soon`);
  const expiredCount = inventoryIssues.filter((i) => i.issue === "expired").length;
  const outCount = inventoryIssues.filter((i) => i.issue === "out_of_stock").length;
  const lowCount = inventoryIssues.filter((i) => i.issue === "low_stock").length;
  const expiringCount = inventoryIssues.filter((i) => i.issue === "expiring_soon").length;
  if (expiredCount > 0) scoreReasons.push(`${expiredCount} expired inventory item${expiredCount !== 1 ? "s" : ""}`);
  if (outCount > 0) scoreReasons.push(`${outCount} item${outCount !== 1 ? "s" : ""} out of stock`);
  if (expiringCount > 0) scoreReasons.push(`${expiringCount} item${expiringCount !== 1 ? "s" : ""} expiring within 90 days`);
  if (lowCount > 0) scoreReasons.push(`${lowCount} item${lowCount !== 1 ? "s" : ""} below minimum stock`);

  return (
    <main className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Boat Health</h1>
        <p className="text-sm text-slate-500">{boat.name} · {engineHours}h engine hours</p>
      </div>

      {/* Score + tiles */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <HealthGauge score={healthScore} overdueCount={overdue.length} size={140} />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-center">
              <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Overdue</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{dueSoon.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Due soon</div>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-3 text-center">
              <div className="text-2xl font-bold text-green-600">{ok.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Healthy</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
              <div className="text-2xl font-bold text-slate-600">{engineHours}</div>
              <div className="text-xs text-slate-500 mt-0.5">Engine hrs</div>
            </div>
          </div>
        </div>

        {/* Why this score */}
        {scoreReasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">Why {healthScore}/100? </span>
              {scoreReasons.join(", ")}.
              {healthScore < 100 ? " Fix the items below to restore your score to 100." : ""}
            </p>
          </div>
        )}
        {scoreReasons.length === 0 && healthScore === 100 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">All clear.</span> Every component is within its service interval and all inventory levels are good.
            </p>
          </div>
        )}
      </div>

      {/* All clear */}
      {!hasIssues && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
          <CheckCircle size={22} className="text-green-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-800">Everything looks good</div>
            <div className="text-sm text-green-700">No overdue maintenance, no low stock, no expiry issues.</div>
          </div>
        </div>
      )}

      {/* Overdue maintenance */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-red-700">Overdue maintenance ({overdue.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {overdue.map((row) => (
              <Link
                key={row.component_id}
                href={`/components/${row.component_id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-800">{row.component_name}</div>
                  <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                  <div className="text-xs text-red-600 font-medium mt-0.5">
                    Log a service to bring this back on track →
                  </div>
                </div>
                <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border-red-200">Overdue</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Due soon maintenance */}
      {dueSoon.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <Clock size={16} className="text-amber-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-amber-700">Due soon ({dueSoon.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dueSoon.map((row) => (
              <Link
                key={row.component_id}
                href={`/components/${row.component_id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <Clock size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-800">{row.component_name}</div>
                  <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                  {row.predicted_due_date && (
                    <div className="text-xs text-amber-600 font-medium mt-0.5">
                      Due {formatDate(row.predicted_due_date)} — schedule service now →
                    </div>
                  )}
                </div>
                <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 border-amber-200">Due soon</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inventory issues */}
      {inventoryIssues.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Package size={16} className="text-slate-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-700">Inventory issues ({inventoryIssues.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {inventoryIssues.map((issue) => {
              const badge = issueLabel(issue);
              const rec = recommendation(issue);
              const isUrgent = issue.issue === "expired" || issue.issue === "out_of_stock";
              return (
                <Link
                  key={issue.id}
                  href={`/inventory/${issue.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  {issue.is_critical
                    ? <ShieldAlert size={16} className={`flex-shrink-0 mt-0.5 ${isUrgent ? "text-red-500" : "text-amber-500"}`} />
                    : <Package size={16} className={`flex-shrink-0 mt-0.5 ${isUrgent ? "text-red-400" : "text-amber-400"}`} />
                  }
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-800">{issue.name}</div>
                    {issue.component_name && (
                      <div className="text-xs text-slate-400">{issue.component_name}</div>
                    )}
                    <div className={`text-xs font-medium mt-0.5 ${isUrgent ? "text-red-600" : "text-amber-600"}`}>
                      {rec} →
                    </div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.text}</span>
                </Link>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-slate-100">
            <Link href="/inventory" className="text-xs text-ocean-600 hover:text-ocean-700 font-medium">
              Go to inventory →
            </Link>
          </div>
        </div>
      )}

      {/* All components */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">All components</h2>
          <Link href="/maintenance" className="text-sm text-ocean-600 hover:text-ocean-700 font-medium">
            Full timeline →
          </Link>
        </div>
        {realHealth.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">No components tracked yet.</div>
        ) : (
          realHealth
            .sort((a, b) => {
              const rank = { overdue: 0, due_soon: 1, ok: 2, unknown: 3 };
              return (rank[normalizeStatus(a.status)] ?? 3) - (rank[normalizeStatus(b.status)] ?? 3);
            })
            .map((row) => {
              const status = normalizeStatus(row.status);
              const Icon =
                status === "overdue" ? AlertTriangle :
                status === "due_soon" ? Clock :
                status === "ok" ? CheckCircle : HelpCircle;
              const iconColor =
                status === "overdue" ? "text-red-500" :
                status === "due_soon" ? "text-amber-500" :
                status === "ok" ? "text-green-500" : "text-slate-400";
              const label =
                status === "overdue" ? "Overdue" :
                status === "due_soon" ? "Due soon" :
                status === "ok" ? "OK" : "Unknown";
              const labelColor =
                status === "overdue" ? "text-red-600" :
                status === "due_soon" ? "text-amber-600" :
                status === "ok" ? "text-green-600" : "text-slate-500";

              return (
                <Link
                  key={row.component_id}
                  href={`/components/${row.component_id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <Icon size={16} className={`flex-shrink-0 ${iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">{row.component_name}</div>
                    <div className="text-xs text-slate-400">{row.system_name ?? "—"}</div>
                  </div>
                  <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
                </Link>
              );
            })
        )}
      </div>
    </main>
  );
}
