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
} from "@/lib/components/queries";
import { getComponentHealthSummary } from "@/lib/components/health";

type ComponentPageProps = {
  params: Promise<{ id: string }>;
};

function statusLabel(status: "ok" | "due_soon" | "overdue" | "unknown") {
  switch (status) {
    case "ok":
      return { text: "OK", className: "text-green-700" };
    case "due_soon":
      return { text: "Due soon", className: "text-amber-700" };
    case "overdue":
      return { text: "Overdue", className: "text-red-700" };
    default:
      return { text: "Unknown", className: "text-neutral-600" };
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

  const [history, linkedInventory, latestBoatEngineHours] = await Promise.all([
    getComponentMaintenanceHistory(component.id),
    getLinkedInventory(component.id),
    getLatestBoatEngineHours(component.boat_id),
  ]);

  const health = getComponentHealthSummary(
    component,
    history,
    latestBoatEngineHours
  );

  const status = statusLabel(health.status);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">
            <Link href={`/dashboard?boat=${component.boat_id}`} className="underline">
              {component.boat?.name ?? "Boat"}
            </Link>
            {" / "}
            <span>{component.system?.name ?? "System"}</span>
          </div>

          <h1 className="mt-2 text-3xl font-semibold">{component.name}</h1>

          {component.notes ? (
            <p className="mt-2 max-w-3xl text-sm text-neutral-600">
              {component.notes}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border p-4 min-w-[220px]">
          <div className="text-sm text-neutral-500">Health status</div>
          <div className={`mt-2 text-2xl font-semibold ${status.className}`}>
            {status.text}
          </div>
          <div className="mt-2 text-sm text-neutral-600">
            Score: {health.score ?? "—"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Last service date</div>
          <div className="mt-2 text-lg font-semibold">
            {health.lastServiceDate
              ? new Date(health.lastServiceDate).toLocaleDateString()
              : "—"}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Days since service</div>
          <div className="mt-2 text-lg font-semibold">
            {health.daysSinceService ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Hours since service</div>
          <div className="mt-2 text-lg font-semibold">
            {health.hoursSinceService ?? "—"}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Service interval</div>
          <div className="mt-2 text-sm font-medium">
            {component.service_interval_days
              ? `${component.service_interval_days} days`
              : "No day interval"}
            <br />
            {component.service_interval_engine_hours
              ? `${component.service_interval_engine_hours} engine hours`
              : "No hour interval"}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Assessment</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {health.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Maintenance history</h2>
            <Link
              href={`/activity?boat=${component.boat_id}`}
              className="text-sm underline"
            >
              View activity
            </Link>
          </div>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">
              No maintenance history recorded for this component.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Work</th>
                    <th className="py-2 pr-4">Engine hrs</th>
                    <th className="py-2 pr-4">Vendor</th>
                  </tr>
                </thead>
                <tbody>
                {history.map((row: MaintenanceHistoryRow) => (
                    <tr key={row.id} className="border-b align-top">
                      <td className="py-3 pr-4">
                        {row.performed_at
                          ? new Date(row.performed_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{row.work_done ?? "Maintenance"}</div>
                      </td>
                      <td className="py-3 pr-4">{row.vendor ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Linked spares</h2>
            <Link
              href={`/inventory?boat=${component.boat_id}`}
              className="text-sm underline"
            >
              View inventory
            </Link>
          </div>

          {linkedInventory.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">
              No inventory items linked to this component yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
                {linkedInventory.map((item: LinkedInventoryRow) => {
                const low =
                  item.minimum_quantity != null &&
                  Number(item.quantity) < Number(item.minimum_quantity);

                return (
                  <li key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-neutral-500">
                          {item.category ?? "Uncategorised"}
                          {item.storage_location ? ` · ${item.storage_location}` : ""}
                          {item.is_critical ? " · Critical" : ""}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          item.is_critical && Number(item.quantity) <= 0
                            ? "text-red-700"
                            : low
                            ? "text-amber-700"
                            : "text-green-700"
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
    </main>
  );
}