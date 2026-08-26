export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { AlertTriangle, CheckCircle, Clock, HelpCircle, Package, ShieldAlert } from "lucide-react";
import { HealthGauge } from "@/components/ui/health-gauge";
import { formatDate } from "@/lib/format-date";
import { normalizeStatus } from "@/lib/component-status";

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


function issueLabel(issue: InventoryIssue): { text: string; style: React.CSSProperties } {
  const red: React.CSSProperties = { background: "#E0342A", color: "#FFFFFF", border: "1.5px solid #E0342A" };
  const amber: React.CSSProperties = { background: "#D9A300", color: "#3D2A00", border: "1.5px solid #D9A300" };
  if (issue.issue === "expired") return { text: "Expired", style: red };
  if (issue.issue === "out_of_stock") return { text: issue.is_critical ? "Out of stock (critical)" : "Out of stock", style: red };
  if (issue.issue === "expiring_soon") {
    const expiry = new Date(issue.expiry_date!); expiry.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    return { text: days <= 0 ? "Expires today" : `Expires in ${days}d`, style: amber };
  }
  return { text: issue.is_critical ? "Low stock (critical)" : "Low stock", style: amber };
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

  const [{ data: boatsData }, selectedBoatId] = await Promise.all([
    supabase.from("boats").select("id,name,type").eq("user_id", user.id).order("created_at", { ascending: true }),
    getSelectedBoatId(),
  ]);

  const boats = (boatsData ?? []) as BoatRow[];
  if (boats.length === 0) redirect("/onboarding");
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
    <main className="space-y-5">
      {/* Navy page hero */}
      <div className="w-full px-4 pt-5 pb-5" style={{ background: "#0B2942" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>Boat Health</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{boat.name} · {engineHours}h engine hours</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5">
      {/* Score + tiles */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <HealthGauge score={healthScore} overdueCount={overdue.length} size={140} />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] px-3 py-3 text-center" style={{ background: overdue.length > 0 ? "#E0342A" : "#F4F7FA", border: `1.5px solid ${overdue.length > 0 ? "#E0342A" : "#DBE3EA"}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: overdue.length > 0 ? "#FFFFFF" : "#0B2942" }}>{overdue.length}</div>
              <div style={{ fontSize: 11, color: overdue.length > 0 ? "rgba(255,255,255,0.7)" : "#8FB3CC", marginTop: 2 }}>Overdue</div>
            </div>
            <div className="rounded-[14px] px-3 py-3 text-center" style={{ background: dueSoon.length > 0 ? "#D9A300" : "#F4F7FA", border: `1.5px solid ${dueSoon.length > 0 ? "#D9A300" : "#DBE3EA"}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: dueSoon.length > 0 ? "#3D2A00" : "#0B2942" }}>{dueSoon.length}</div>
              <div style={{ fontSize: 11, color: dueSoon.length > 0 ? "rgba(61,42,0,0.6)" : "#8FB3CC", marginTop: 2 }}>Due soon</div>
            </div>
            <div className="rounded-[14px] px-3 py-3 text-center" style={{ background: ok.length > 0 ? "#0E7A3D" : "#F4F7FA", border: `1.5px solid ${ok.length > 0 ? "#0E7A3D" : "#DBE3EA"}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: ok.length > 0 ? "#FFFFFF" : "#0B2942" }}>{ok.length}</div>
              <div style={{ fontSize: 11, color: ok.length > 0 ? "rgba(255,255,255,0.7)" : "#8FB3CC", marginTop: 2 }}>Healthy</div>
            </div>
            <div className="rounded-[14px] px-3 py-3 text-center" style={{ background: "#0B7EB8", border: "1.5px solid #0B7EB8" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>{engineHours}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Engine hrs</div>
            </div>
          </div>
        </div>

        {/* Why this score */}
        {scoreReasons.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: "1.5px solid #DBE3EA" }}>
            <p style={{ fontSize: 13, color: "#0B2942" }}>
              <span style={{ fontWeight: 700 }}>Why {healthScore}/100? </span>
              {scoreReasons.join(", ")}.
              {healthScore < 100 ? " Fix the items below to restore your score to 100." : ""}
            </p>
          </div>
        )}
        {scoreReasons.length === 0 && healthScore === 100 && (
          <div className="mt-4 pt-4" style={{ borderTop: "1.5px solid #DBE3EA" }}>
            <p style={{ fontSize: 13, color: "#0B2942" }}>
              <span style={{ fontWeight: 700 }}>All clear.</span> Every component is within its service interval and all inventory levels are good.
            </p>
          </div>
        )}
      </div>

      {/* All clear */}
      {!hasIssues && (
        <div className="card p-5 flex items-center gap-3" style={{ borderColor: "#0E7A3D33", background: "#E6F6EC" }}>
          <CheckCircle size={22} style={{ color: "#0E7A3D", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: "#0E7A3D" }}>Everything looks good</div>
            <div style={{ fontSize: 13, color: "#0E7A3D", opacity: 0.8 }}>No overdue maintenance, no low stock, no expiry issues.</div>
          </div>
        </div>
      )}

      {/* Overdue maintenance */}
      {overdue.length > 0 && (
        <div id="overdue" className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1.5px solid rgba(255,255,255,0.15)", background: "#E0342A" }}>
            <AlertTriangle size={16} style={{ color: "#FFFFFF", flexShrink: 0 }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>Overdue maintenance ({overdue.length})</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#DBE3EA" }}>
            {overdue.map((row) => (
              <Link
                key={row.component_id}
                href={`/components/${row.component_id}`}
                className="flex items-start gap-3 px-4 py-3"
              >
                <AlertTriangle size={16} style={{ color: "#E0342A", flexShrink: 0, marginTop: 2 }} />
                <div className="min-w-0 flex-1">
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0B2942" }}>{row.component_name}</div>
                  <div style={{ fontSize: 12, color: "#8FB3CC" }}>{row.system_name ?? "—"}</div>
                  <div style={{ fontSize: 12, color: "#E0342A", fontWeight: 600, marginTop: 2 }}>
                    Log a service to bring this back on track →
                  </div>
                </div>
                <span className="badge badge-missing flex-shrink-0">Overdue</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Due soon maintenance */}
      {dueSoon.length > 0 && (
        <div id="due-soon" className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1.5px solid rgba(0,0,0,0.1)", background: "#D9A300" }}>
            <Clock size={16} style={{ color: "#3D2A00", flexShrink: 0 }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#3D2A00" }}>Due soon ({dueSoon.length})</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#DBE3EA" }}>
            {dueSoon.map((row) => (
              <Link
                key={row.component_id}
                href={`/components/${row.component_id}`}
                className="flex items-start gap-3 px-4 py-3"
              >
                <Clock size={16} style={{ color: "#D9A300", flexShrink: 0, marginTop: 2 }} />
                <div className="min-w-0 flex-1">
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0B2942" }}>{row.component_name}</div>
                  <div style={{ fontSize: 12, color: "#8FB3CC" }}>{row.system_name ?? "—"}</div>
                  {row.predicted_due_date && (
                    <div style={{ fontSize: 12, color: "#D9A300", fontWeight: 600, marginTop: 2 }}>
                      Due {formatDate(row.predicted_due_date)} — schedule service now →
                    </div>
                  )}
                </div>
                <span className="badge badge-low flex-shrink-0">Due soon</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inventory issues */}
      {inventoryIssues.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1.5px solid #DBE3EA" }}>
            <Package size={16} style={{ color: "#8FB3CC", flexShrink: 0 }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0B2942" }}>Inventory issues ({inventoryIssues.length})</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#DBE3EA" }}>
            {inventoryIssues.map((issue) => {
              const badge = issueLabel(issue);
              const rec = recommendation(issue);
              const isUrgent = issue.issue === "expired" || issue.issue === "out_of_stock";
              return (
                <Link
                  key={issue.id}
                  href={`/inventory/${issue.id}`}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  {issue.is_critical
                    ? <ShieldAlert size={16} style={{ color: isUrgent ? "#E0342A" : "#D9A300", flexShrink: 0, marginTop: 2 }} />
                    : <Package size={16} style={{ color: isUrgent ? "#E0342A" : "#D9A300", flexShrink: 0, marginTop: 2 }} />
                  }
                  <div className="min-w-0 flex-1">
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0B2942" }}>{issue.name}</div>
                    {issue.component_name && (
                      <div style={{ fontSize: 12, color: "#8FB3CC" }}>{issue.component_name}</div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: isUrgent ? "#E0342A" : "#D9A300" }}>
                      {rec} →
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={badge.style}>{badge.text}</span>
                </Link>
              );
            })}
          </div>
          <div className="px-4 py-2" style={{ borderTop: "1.5px solid #DBE3EA" }}>
            <Link href="/inventory" style={{ fontSize: 13, color: "#0B7EB8", fontWeight: 600 }}>
              Go to inventory →
            </Link>
          </div>
        </div>
      )}

      {/* All components */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1.5px solid #DBE3EA" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}>All components</h2>
          <Link href="/maintenance" style={{ fontSize: 13, color: "#0B7EB8", fontWeight: 600 }}>
            Full timeline →
          </Link>
        </div>
        {realHealth.length === 0 ? (
          <div className="px-4 py-6" style={{ fontSize: 14, color: "#8FB3CC" }}>No components tracked yet.</div>
        ) : (
          realHealth
            .sort((a, b) => {
              const rank: Record<string, number> = { overdue: 0, due_soon: 1, ok: 2, unknown: 3 };
              return (rank[normalizeStatus(a.status)] ?? 3) - (rank[normalizeStatus(b.status)] ?? 3);
            })
            .map((row) => {
              const status = normalizeStatus(row.status);
              const Icon =
                status === "overdue" ? AlertTriangle :
                status === "due_soon" ? Clock :
                status === "ok" ? CheckCircle : HelpCircle;
              const iconStyle: React.CSSProperties = {
                color: status === "overdue" ? "#E0342A" : status === "due_soon" ? "#D9A300" : status === "ok" ? "#0E7A3D" : "#8FB3CC",
                flexShrink: 0,
              };
              const label =
                status === "overdue" ? "Overdue" :
                status === "due_soon" ? "Due soon" :
                status === "ok" ? "OK" : "Unknown";
              const labelStyle: React.CSSProperties = {
                fontSize: 12, fontWeight: 700,
                color: status === "overdue" ? "#E0342A" : status === "due_soon" ? "#D9A300" : status === "ok" ? "#0E7A3D" : "#8FB3CC",
              };

              return (
                <Link
                  key={row.component_id}
                  href={`/components/${row.component_id}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Icon size={16} style={iconStyle} />
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0B2942" }} className="truncate">{row.component_name}</div>
                    <div style={{ fontSize: 12, color: "#8FB3CC" }}>{row.system_name ?? "—"}</div>
                  </div>
                  <span style={labelStyle}>{label}</span>
                </Link>
              );
            })
        )}
      </div>
      </div>
    </main>
  );
}
