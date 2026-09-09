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
  getLinkedInventory,
  getBoatInventory,
} from "@/lib/components/queries";
import { getComponentHealthSummary } from "@/lib/components/health";
import { LogMaintenanceForm } from "@/components/components/log-maintenance-form";
import { EditComponentForm } from "@/components/components/edit-component-form";
import LogMaintenanceButton from "@/components/components/log-maintenance-button";
import { DeleteMaintenanceEventButton } from "@/components/components/delete-maintenance-event-button";
import { EditMaintenanceButton } from "@/components/components/edit-maintenance-button";

type ComponentPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(status: "ok" | "due_soon" | "overdue" | "unknown") {
  switch (status) {
    case "ok":
      return { text: "OK", bg: "#0E7A3D", fg: "#FFFFFF", labelFg: "rgba(255,255,255,0.7)" };
    case "due_soon":
      return { text: "Due soon", bg: "#D9A300", fg: "#3D2A00", labelFg: "rgba(61,42,0,0.6)" };
    case "overdue":
      return { text: "Overdue", bg: "#E0342A", fg: "#FFFFFF", labelFg: "rgba(255,255,255,0.7)" };
    default:
      return { text: "Unknown", bg: "#F4F7FA", fg: "#8FB3CC", labelFg: "#8FB3CC" };
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

  const [history, linkedInventory, boatInventory, tripsData, { data: systemsData }] = await Promise.all([
    getComponentMaintenanceHistory(component.id),
    getLinkedInventory(component.id),
    getBoatInventory(component.boat_id),
    supabase
      .from("trips")
      .select("started_at, engine_hours_delta")
      .eq("boat_id", component.boat_id)
      .not("engine_hours_delta", "is", null)
      .order("started_at", { ascending: true })
      .then((r) => (r.data ?? []) as { started_at: string | null; engine_hours_delta: number }[]),
    supabase.from("systems").select("id,name").eq("boat_id", component.boat_id).order("name", { ascending: true }),
  ]);
  const systems = (systemsData ?? []) as { id: string; name: string }[];

  const health = getComponentHealthSummary(
    component,
    history,
    tripsData
  );

  const status = statusLabel(health.status);

  return (
    <main className="px-4 py-6 space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/components" className="text-sm text-slate-500 hover:text-ocean-600">
              {component.boat?.name ?? "Boat"}
            </Link>
            {" / "}
            <span>{component.system?.name ?? "System"}</span>
          </div>

          <h1 className="mt-2 text-xl font-bold text-slate-900">{component.name}</h1>

          {component.notes ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-500 whitespace-pre-line">
              {component.notes}
            </p>
          ) : null}

          <div className="mt-3">
            <LogMaintenanceButton
              componentId={component.id}
              boatId={component.boat_id}
              inventoryOptions={boatInventory.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
              }))}
            />
          </div>
        </div>

        <div className="rounded-xl p-4 min-w-[220px]" style={{ background: status.bg, border: `1.5px solid ${status.bg}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: status.labelFg }}>Health status</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: status.fg }}>
            {status.text}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: status.labelFg }}>
            Score: {health.score ?? "—"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-sm text-slate-500">Last service date</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.lastServiceDate
              ? new Date(health.lastServiceDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
              : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-sm text-slate-500">Days since service</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.daysSinceService ?? "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-sm text-slate-500">Hours since service</div>
          <div className="mt-2 text-2xl font-semibold text-slate-800">
            {health.hoursSinceService ?? "—"}
          </div>
        </div>

        {health.predictedDueDate && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm text-slate-500">Next service due</div>
            <div className="mt-2 text-lg font-semibold text-slate-800">
              {new Date(health.predictedDueDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">earliest of time or hours</div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <h2 className="text-base font-semibold text-slate-800">Assessment</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          {health.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
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

      {/* Maintenance history — below the danger zone */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Maintenance history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No maintenance history recorded for this component.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Work done</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Engine hrs</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Vendor</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Cost</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row: MaintenanceHistoryRow) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 align-top">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.performed_at
                          ? new Date(row.performed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{row.work_done ?? "Maintenance"}</div>
                        {row.photo_urls && row.photo_urls.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {row.photo_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Photo ${i + 1}`} loading="eager" className="w-12 h-12 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition" />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{row.engine_hours_at_service ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{row.vendor ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 hidden sm:table-cell">
                        {row.cost != null ? `$${Number(row.cost).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <EditMaintenanceButton
                            eventId={row.id}
                            componentId={component.id}
                            performedAt={row.performed_at}
                            workDone={row.work_done}
                            notes={row.notes}
                            vendor={row.vendor}
                            engineHoursAtService={row.engine_hours_at_service}
                            cost={row.cost}
                          />
                          <DeleteMaintenanceEventButton eventId={row.id} componentId={component.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
