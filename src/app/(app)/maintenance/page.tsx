import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { getBoatHealth } from "@/lib/components/health";
import { AddComponentSheet } from "@/components/components/add-component-sheet";
import { formatDate } from "@/lib/format-date";
import { type StatusFilter, normalizeStatus } from "@/lib/component-status";

export const dynamic = "force-dynamic";

type MaintenancePageProps = {
  searchParams: Promise<{ boat?: string; horizon?: string }>;
};

type BoatRow = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
};

type HealthRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  risk_score: number | null;
  status: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  months_until_due: number | null;
  predicted_due_date: string | null;
};

type TimelineRow = {
  component_id: string;
  component_name: string;
  system_name: string | null;
  hours_since_service: number | null;
  hours_until_due: number | null;
  predicted_due_date: string | null;
  status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
  risk_score: number | null;
};

const HORIZONS = [30, 90, 180] as const;

function timelineStatusLabel(status: TimelineRow["status"]) {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "planned":
      return "Planned";
    case "later":
      return "Later";
    default:
      return "Unknown";
  }
}

function timelineStatusStyle(status: TimelineRow["status"]): React.CSSProperties {
  switch (status) {
    case "overdue":
      return { background: "#FDECEA", color: "#E0342A", border: "1.5px solid #F5BCBA" };
    case "due_soon":
      return { background: "#FFF6DF", color: "#D9A300", border: "1.5px solid #F5E0A0" };
    case "planned":
      return { background: "#E6F3FA", color: "#0B7EB8", border: "1.5px solid #B0D4EE" };
    default:
      return { background: "#F4F7FA", color: "#8FB3CC", border: "1.5px solid #DBE3EA" };
  }
}

function statusRank(status: string | null) {
  switch (normalizeStatus(status)) {
    case "overdue":
      return 0;
    case "due_soon":
      return 1;
    case "ok":
      return 2;
    default:
      return 3;
  }
}

function parseHorizon(value: string | undefined) {
  const parsed = Number(value);
  if (parsed === 30 || parsed === 90 || parsed === 180) return parsed;
  return 90;
}


export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  noStore();

  const params = await searchParams;
  const selectedHorizon = parseHorizon(params.horizon);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/maintenance");

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) {
    redirect("/onboarding");
  }

  const selectedBoatId = await getSelectedBoatId();
  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [allHealthRaw, { data: maintenanceSystemsData }] = await Promise.all([
    getBoatHealth(boat.id),
    supabase.from("systems").select("id,name").eq("boat_id", boat.id).order("name"),
  ]);

  const maintenanceSystems = (maintenanceSystemsData ?? []) as { id: string; name: string }[];

  const allHealth = (allHealthRaw as HealthRow[]).sort((a, b) => {
    const statusCompare = statusRank(a.status) - statusRank(b.status);
    if (statusCompare !== 0) return statusCompare;
    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });

  const horizonDate = new Date();
  horizonDate.setDate(horizonDate.getDate() + selectedHorizon);
  const horizonStr = horizonDate.toISOString().slice(0, 10);
  function toTimelineStatus(row: HealthRow): TimelineRow["status"] {
    const s = normalizeStatus(row.status);
    if (s === "overdue") return "overdue";
    if (s === "due_soon") return "due_soon";
    if (s === "unknown") return "unknown";
    // "ok" — check if predicted_due_date falls within the horizon
    if (row.predicted_due_date && row.predicted_due_date <= horizonStr) return "planned";
    return "later";
  }

  const timeline: TimelineRow[] = allHealth
    .map((row) => ({
      component_id: row.component_id,
      component_name: row.component_name,
      system_name: row.system_name,
      hours_since_service: row.hours_since_service,
      hours_until_due: row.hours_until_due,
      predicted_due_date: row.predicted_due_date,
      status: toTimelineStatus(row),
      risk_score: row.risk_score,
    }))
    .filter((row) => row.status !== "later");

  const overdueCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "overdue"
  ).length;

  const dueSoonCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "due_soon"
  ).length;

  const okCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "ok"
  ).length;

  const unknownCount = allHealth.filter(
    (row) => normalizeStatus(row.status) === "unknown"
  ).length;

  const timelineOverdue = timeline.filter((row) => row.status === "overdue");
  const timelineDueSoon = timeline.filter((row) => row.status === "due_soon");
  const timelinePlanned = timeline.filter((row) => row.status === "planned");
  const timelineUnknown = timeline.filter((row) => row.status === "unknown");

  const timelinePreview = [
    ...timelineOverdue,
    ...timelineDueSoon,
    ...timelinePlanned,
  ].slice(0, 6);

  return (
    <main className="px-4 py-6 space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0B2942" }}>Maintenance</h1>
          <div className="mt-3 flex gap-2">
            <AddComponentSheet boatId={boat.id} systems={maintenanceSystems} boatType={boat.type ?? undefined} />
            <Link
              href="/components"
              className="inline-flex items-center gap-1.5 px-4 py-2.5"
              style={{ background: "#FFFFFF", border: "1.5px solid #DBE3EA", borderRadius: 13, fontSize: 14, fontWeight: 800, color: "#0B2942" }}
            >
              All components
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: "#F4F7FA", border: "1.5px solid #DBE3EA" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#0B2942", opacity: 0.5 }}>TOTAL</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{allHealth.length}</div>
        </div>

        <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: overdueCount > 0 ? "#FDECEA" : "#F4F7FA", border: `1.5px solid ${overdueCount > 0 ? "#F5BCBA" : "#DBE3EA"}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: overdueCount > 0 ? "#E0342A" : "#0B2942", opacity: overdueCount > 0 ? 1 : 0.5 }}>OVERDUE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: overdueCount > 0 ? "#E0342A" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{overdueCount}</div>
        </div>

        <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: dueSoonCount > 0 ? "#FFF6DF" : "#F4F7FA", border: `1.5px solid ${dueSoonCount > 0 ? "#F5E0A0" : "#DBE3EA"}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: dueSoonCount > 0 ? "#D9A300" : "#0B2942", opacity: dueSoonCount > 0 ? 1 : 0.5 }}>DUE SOON</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: dueSoonCount > 0 ? "#D9A300" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dueSoonCount}</div>
        </div>

        <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: okCount > 0 ? "#E6F6EC" : "#F4F7FA", border: `1.5px solid ${okCount > 0 ? "#A8DDB8" : "#DBE3EA"}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: okCount > 0 ? "#0E7A3D" : "#0B2942", opacity: okCount > 0 ? 1 : 0.5 }}>HEALTHY</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: okCount > 0 ? "#0E7A3D" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{okCount}</div>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0B2942" }}>Predictive Timeline</h2>
            <p style={{ fontSize: 13, color: "#8FB3CC", marginTop: 4 }}>
              Forecast upcoming maintenance based on service intervals and recent usage.
            </p>
          </div>

          <div className="flex gap-2">
            {HORIZONS.map((days) => {
              const href = `/maintenance?horizon=${days}`;
              const active = selectedHorizon === days;
              return (
                <Link
                  key={days}
                  href={href}
                  style={{
                    borderRadius: 8,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    background: active ? "#0B2942" : "#F4F7FA",
                    color: active ? "#FFFFFF" : "#8FB3CC",
                    border: `1.5px solid ${active ? "#0B2942" : "#DBE3EA"}`,
                  }}
                >
                  {days}d
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: timelineOverdue.length > 0 ? "#FDECEA" : "#F4F7FA", border: `1.5px solid ${timelineOverdue.length > 0 ? "#F5BCBA" : "#DBE3EA"}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: timelineOverdue.length > 0 ? "#E0342A" : "#0B2942", opacity: timelineOverdue.length > 0 ? 1 : 0.5 }}>OVERDUE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: timelineOverdue.length > 0 ? "#E0342A" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timelineOverdue.length}</div>
          </div>

          <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: timelineDueSoon.length > 0 ? "#FFF6DF" : "#F4F7FA", border: `1.5px solid ${timelineDueSoon.length > 0 ? "#F5E0A0" : "#DBE3EA"}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: timelineDueSoon.length > 0 ? "#D9A300" : "#0B2942", opacity: timelineDueSoon.length > 0 ? 1 : 0.5 }}>DUE SOON</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: timelineDueSoon.length > 0 ? "#D9A300" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timelineDueSoon.length}</div>
          </div>

          <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: timelinePlanned.length > 0 ? "#E6F3FA" : "#F4F7FA", border: `1.5px solid ${timelinePlanned.length > 0 ? "#B0D4EE" : "#DBE3EA"}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: timelinePlanned.length > 0 ? "#0B7EB8" : "#0B2942", opacity: timelinePlanned.length > 0 ? 1 : 0.5 }}>PLANNED · {selectedHorizon}D</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: timelinePlanned.length > 0 ? "#0B7EB8" : "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timelinePlanned.length}</div>
          </div>

          <div className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: "#F4F7FA", border: "1.5px solid #DBE3EA" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#0B2942", opacity: 0.5 }}>UNKNOWN</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0B2942", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{timelineUnknown.length}</div>
          </div>
        </div>

        {timelinePreview.length === 0 ? (
          <p className="mt-4" style={{ fontSize: 14, color: "#8FB3CC" }}>
            No predictive maintenance items are currently forecast.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {timelinePreview.map((row) => (
              <div key={row.component_id} className="card p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link href={`/components/${row.component_id}`} style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }} className="hover:opacity-70 transition-opacity">{row.component_name}</Link>
                    <div style={{ fontSize: 13, color: "#8FB3CC", marginTop: 2 }}>
                      {row.system_name ?? "—"}
                    </div>
                  </div>

                  <div
                    className="inline-flex rounded-full px-3 py-1"
                    style={{ ...timelineStatusStyle(row.status), fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const }}
                  >
                    {timelineStatusLabel(row.status)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[13px] p-3" style={{ background: "#F4F7FA" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#8FB3CC", textTransform: "uppercase" }}>
                      Predicted due
                    </div>
                    <div className="mt-1" style={{ fontSize: 14, fontWeight: 800, color: "#0B2942" }}>
                      {formatDate(row.predicted_due_date)}
                    </div>
                  </div>

                  <div className="rounded-[13px] p-3" style={{ background: "#F4F7FA" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#8FB3CC", textTransform: "uppercase" }}>
                      Hrs since service
                    </div>
                    <div className="mt-1" style={{ fontSize: 14, fontWeight: 800, color: "#0B2942" }}>
                      {row.hours_since_service != null ? Math.round(row.hours_since_service) : "—"}
                    </div>
                  </div>

                  <div className="rounded-[13px] p-3" style={{ background: "#F4F7FA" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#8FB3CC", textTransform: "uppercase" }}>
                      Hrs until due
                    </div>
                    <div className="mt-1" style={{ fontSize: 14, fontWeight: 800, color: "#0B2942" }}>
                      {row.hours_until_due != null ? Math.round(row.hours_until_due) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  {(() => {
                    const score = Math.min(100, Math.round(Number(row.risk_score ?? 0)));
                    const barColor = score >= 70 ? "#E0342A" : score >= 40 ? "#D9A300" : "#0E7A3D";
                    const barBg = score >= 70 ? "#FDECEA" : score >= 40 ? "#FFF6DF" : "#E6F6EC";
                    const label = score >= 70 ? "High risk" : score >= 40 ? "Moderate risk" : "Low risk";
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 800, color: "#8FB3CC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="#0B7EB8" />
                            </svg>
                            AI Risk
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{label} · {score}</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 7, background: barBg }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${score}%`, background: barColor, minWidth: score > 0 ? 4 : 0 }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
