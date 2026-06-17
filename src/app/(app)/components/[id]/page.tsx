import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceHistoryRow, LinkedInventoryRow } from "@/lib/components/queries";
import {
  getComponentDetail,
  getComponentMaintenanceHistory,
  getLatestBoatEngineHours,
  getLinkedInventory,
} from "@/lib/components/queries";
import { getComponentHealthSummary } from "@/lib/components/health";
import { LogMaintenanceForm } from "@/components/components/log-maintenance-form";

type ComponentPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(status: "ok" | "due_soon" | "overdue" | "unknown") {
  switch (status) {
    case "ok":
      return { text: "OK", badgeClass: "bg-green-50 text-green-700 border-green-200" };
    case "due_soon":
      return { text: "Due soon", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
    case "overdue":
      return { text: "Overdue", badgeClass: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { text: "Unknown", badgeClass: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let component;
  try {
    component = await getComponentDetail(id);
  } catch (error) {
    throw error;
  }

  if (!component || component.user_id !== user.id) notFound();

  const [history, linkedInventory, latestBoatEngineHours] = await Promise.all([
    getComponentMaintenanceHistory(component.id),
    getLinkedInventory(component.id),
    getLatestBoatEngineHours(component.boat_id),
  ]);

  const health = getComponentHealthSummary(component, history, latestBoatEngineHours);
  const status = statusLabel(health.status);

  return (
    <main className="px-4 py-6 space-y-5 max-w-3xl mx-auto">
      {/* Breadcrumb + title */}
      <div>
        <div className="text-sm text-slate-500 mb-1">
          <Link href="/components" className="hover:text-ocean-600 transition-colors">
            {component.boat?.name ?? "Boat"}
          </Link>
          {" / "}
          <span>{component.system?.name ?? "System"}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800">{component.name}</h1>
          <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${status.badgeClass}`}>
            {status.text}
          </span>
        </div>
        {component.notes && (
          <p className="mt-1 text-sm text-slate-500">{component.notes}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Last service</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {health.lastServiceDate
              ? new Date(health.lastServiceDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
              : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Days since</div>
          <div className="mt-1 text-base font-semibold text-slate-800">{health.daysSinceService ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Hours since</div>
          <div className="mt-1 text-base font-semibold text-slate-800">{health.hoursSinceService ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Interval</div>
          <div className="mt-1 text-sm font-medium text-slate-800">
            {component.service_interval_days ? `${component.service_interval_days}d` : "—"}
            {component.service_interval_engine_hours ? ` / ${component.service_interval_engine_hours}h` : ""}
          </div>
        </div>
      </div>

      {/* Assessment */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800 mb-3">Assessment</h2>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {health.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="text-slate-400">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Log maintenance form */}
      <LogMaintenanceForm
        componentId={component.id}
        boatId={component.boat_id}
        inventoryOptions={linkedInventory.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }))}
      />

      {/* History + Spares */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Maintenance history</h2>
          </div>
          {history.length === 0 ? (
            <p className="px-4 py-5 text-sm text-slate-500">No maintenance history recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Work</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row: MaintenanceHistoryRow) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.performed_at
                          ? new Date(row.performed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.work_done ?? "Maintenance"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.engine_hours_at_service ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Linked spares</h2>
            <Link href={`/inventory?boat=${component.boat_id}`} className="text-sm text-ocean-600 hover:text-ocean-700 font-medium">
              Inventory →
            </Link>
          </div>
          {linkedInventory.length === 0 ? (
            <p className="px-4 py-5 text-sm text-slate-500">No inventory items linked yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {linkedInventory.map((item: LinkedInventoryRow) => {
                const low = item.minimum_quantity != null && Number(item.quantity) < Number(item.minimum_quantity);
                return (
                  <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div>
                      <div className="font-medium text-sm text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.category ?? "Uncategorised"}
                        {item.storage_location ? ` · ${item.storage_location}` : ""}
                        {item.is_critical ? " · Critical" : ""}
                      </div>
                    </div>
                    <div className={`text-sm font-medium flex-shrink-0 ${
                      item.is_critical && Number(item.quantity) <= 0
                        ? "text-red-600"
                        : low ? "text-amber-600" : "text-green-600"
                    }`}>
                      {item.quantity} {item.unit ?? ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
