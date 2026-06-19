export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBoatHealth } from "@/lib/components/health";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { HealthGauge } from "@/components/ui/health-gauge";

type BoatRow = { id: string; name: string; type: string | null };
type HealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
};
type TimelineRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  predicted_due_date: string | null;
  hours_until_due: number | null;
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
  explanation: string | null;
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

  const [health, timelineRes, engineHoursRes] = await Promise.all([
    getBoatHealth(boat.id),
    supabase.rpc("get_boat_maintenance_timeline", { p_boat_id: boat.id, p_horizon_days: 90 }),
    supabase.rpc("get_boat_engine_hours", { p_boat_id: boat.id }),
  ]);

  const timeline = (timelineRes.data ?? []) as TimelineRow[];
  const engineHours = (engineHoursRes.data as number) ?? 0;

  const overdue = health.filter((r) => normalizeStatus(r.status) === "overdue");
  const dueSoon = health.filter((r) => normalizeStatus(r.status) === "due_soon");
  const ok = health.filter((r) => normalizeStatus(r.status) === "ok");
  const unknown = health.filter((r) => normalizeStatus(r.status) === "unknown");

  const knownHealth = health.filter((r) => r.risk_score != null);
  const avgRisk = knownHealth.length > 0
    ? knownHealth.reduce((s, c) => s + (c.risk_score ?? 0), 0) / knownHealth.length
    : 0;
  const healthScore = Math.max(0, Math.round(100 - avgRisk));

  const urgent = timeline.filter((r) => r.status === "overdue" || r.status === "due_soon");

  return (
    <main className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Boat Health</h1>
        <p className="text-sm text-slate-500">{boat.name} · {engineHours}h engine hours</p>
      </div>

      {/* Health score with gauge */}
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
      </div>

      {/* Urgent items */}
      {urgent.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Needs attention</h2>
          {urgent.map((row) => {
            const isOverdue = row.status === "overdue";
            return (
              <Link
                key={row.component_id}
                href={`/components/${row.component_id}`}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`mt-0.5 flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800 text-sm">{row.component_name}</div>
                  <div className="text-xs text-slate-500">{row.system_name ?? "—"}</div>
                  {row.predicted_due_date && (
                    <div className={`text-xs mt-0.5 font-medium ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
                      {isOverdue ? "Overdue" : `Due ${formatDate(row.predicted_due_date)}`}
                    </div>
                  )}
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${
                  isOverdue
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                  {isOverdue ? "Overdue" : "Due soon"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* All clear */}
      {urgent.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
          <CheckCircle size={22} className="text-green-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-800">All clear</div>
            <div className="text-sm text-green-700">No overdue or upcoming maintenance in the next 90 days.</div>
          </div>
        </div>
      )}

      {/* All components */}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">All components</h2>
          <Link href="/maintenance" className="text-sm text-ocean-600 hover:text-ocean-700 font-medium">
            Full timeline →
          </Link>
        </div>
        {health.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">No components tracked yet.</div>
        ) : (
          health
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
