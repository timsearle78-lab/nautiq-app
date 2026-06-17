import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
    MaintenanceHistoryRow,
    LinkedInventoryRow,
} from "@/lib/components/queries";
import {
  getComponentDetail,
  getComponentMaintenanceHistory,
  getLatestBoatEngineHours,
  getLinkedInventory,
  getBoatInventory,
} from "@/lib/components/queries";
import { getComponentHealthSummary } from "@/lib/components/health";
import { LogMaintenanceForm } from "@/components/components/log-maintenance-form";
import { EditComponentForm } from "@/components/components/edit-component-form";

type ComponentPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(status: "ok" | "due_soon" | "overdue" | "unknown") {
  switch (status) {
    case "ok":
      return {
        text: "OK",
        className: "text-green-600 bg-green-50 border border-green-200",
      };
    case "due_soon":
      return {
        text: "Due soon",
        className: "text-amber-600 bg-amber-50 border border-amber-200",
      };
    case "overdue":
      return {
        text: "Overdue",
        className: "text-red-600 bg-red-50 border border-red-200",
      };
    default:
      return {
        text: "Unknown",
        className: "text-slate-500 bg-slate-50 border border-slate-200",
      };
  }
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let component;
  try {
    component = await getComponentDetail(id);
  } catch (error) {
    throw error;
  }

  if (!component || component.user_id !== user.id) {
    notFound();
  }

  const [history, linkedInventory, boatInventory, latestBoatEngineHours] = await Promise.all([
    getComponentMaintenanceHistory(component.id),
    getLinkedInventory(component.id),
    getBoatInventory(component.boat_id),
    getLatestBoatEngineHours(component.boat_id),
  ]);

  const { data: systemsData } = await supabase
    .from("systems")
    .select("id,name")
    .eq("boat_id", component.boat_id)
    .order("name", { ascending: true });
  const systems = (systemsData ?? []) as { id: string; name: string }[];

  const health = getComponentHealthSummary(
    component,
    history,
    latestBoatEngineHours
  );

  const status = statusLabel(health.status);

  return (
    <main className="px-4 py-6 space-y-5 max-w-5xl mx-auto">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/components" className="text-sm text-slate-500 hover:text-ocean-600">
              {component.boat?.name ?? "Boat"}
            </Link>
            {" / "}
            <span>{component.system?.name ?? "System"}</span>
          </div>

          <h1 className="mt-2 text-xl font-semibold text-slate-800">{component.name}</h1>

          {component.notes ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              {component.notes}
            </p>
          ) : null}
        </div>

        <div className={`rounded-xl p-4 min-w-[220px] ${status.className}`}>
          <div className="text-sm font-medium opacity-70">Health status</div>
          <div className="mt-2 text-2xl font-semibold">
            {status.text}
          </div>
          <div className="mt-2 text-sm opacity-70">
            Score: {health.score ?? "—"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Last service date</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.lastServiceDate
              ? new Date(health.lastServiceDate).toLocaleDateString()
              : "—"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Days since service</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.daysSinceService ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Hours since service</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.hoursSinceService ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Service interval</div>
          <div className="mt-2 text-sm font-medium text-slate-800 space-y-0.5">
            {(() => {
              const parts = [];
              if (component.service_interval_years) parts.push(`${component.service_interval_years}y`);
              if (component.service_interval_months) parts.push(`${component.service_interval_months}mo`);
              if (component.service_interval_days) parts.push(`${component.service_interval_days}d`);
              return parts.length > 0
                ? <div>{parts.join(" ")}</div>
                : <div className="text-slate-400">No time interval</div>;
            })()}
            {component.service_interval_engine_hours
              ? <div>{component.service_interval_engine_hours} hrs</div>
              : <div className="text-slate-400">No hour interval</div>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">Assessment</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          {health.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </section>

      <LogMaintenanceForm
        componentId={component.id}
        boatId={component.boat_id}
        inventoryOptions={boatInventory.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }))}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">Maintenance history</h2>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No maintenance history recorded for this component.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Work</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Engine hrs</th>
                    <th className="py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row: MaintenanceHistoryRow) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                      <td className="py-3 pr-4">
                        {row.performed_at
                          ? new Date(row.performed_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{row.work_done ?? "Maintenance"}</div>
                      </td>
                      <td className="py-3 pr-4">{row.engine_hours_at_service ?? "—"}</td>
                      <td className="py-3 pr-4">{row.vendor ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">Linked spares</h2>

          {linkedInventory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No inventory items linked to this component yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {linkedInventory.map((item: LinkedInventoryRow) => {
                const low =
                  item.minimum_quantity != null &&
                  Number(item.quantity) < Number(item.minimum_quantity);

                return (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.category ?? "Uncategorised"}
                          {item.storage_location ? ` · ${item.storage_location}` : ""}
                          {item.is_critical ? " · Critical" : ""}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          item.is_critical && Number(item.quantity) <= 0
                            ? "text-red-600"
                            : low
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.quantity} {item.unit ?? ""}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <EditComponentForm
        id={component.id}
        name={component.name}
        systemId={component.system_id}
        systems={systems}
        installDate={component.install_date}
        serviceIntervalYears={component.service_interval_years}
        serviceIntervalMonths={component.service_interval_months}
        serviceIntervalDays={component.service_interval_days}
        serviceIntervalEngineHours={component.service_interval_engine_hours}
        notes={component.notes}
      />
    </main>
  );
}
