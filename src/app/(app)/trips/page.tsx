import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSelectedBoatId } from "@/lib/selected-boat";
import { AddTripButton } from "@/components/trips/add-trip-button";
import { EngineHoursChart } from "@/components/trips/engine-hours-chart";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { EditTripButton } from "@/components/trips/edit-trip-button";


export const dynamic = "force-dynamic";

type TripRow = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  engine_hours_delta: number | null;
  fuel_added_litres: number | null;
  notes: string | null;
  source: string | null;
};

function startOf(unit: "week" | "month" | "year"): Date {
  const now = new Date();
  if (unit === "week") {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday
    return d;
  }
  if (unit === "month") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

function sumEngineHours(trips: TripRow[], since: Date) {
  return trips
    .filter((t) => t.started_at && new Date(t.started_at) >= since)
    .reduce((s, t) => s + (t.engine_hours_delta ?? 0), 0);
}

function sumDurationHours(trips: TripRow[], since: Date) {
  return trips
    .filter((t) => t.started_at && new Date(t.started_at) >= since && t.ended_at)
    .reduce((s, t) => {
      const ms = new Date(t.ended_at!).getTime() - new Date(t.started_at!).getTime();
      return s + ms / 3_600_000;
    }, 0);
}

function countTrips(trips: TripRow[], since: Date) {
  return trips.filter((t) => t.started_at && new Date(t.started_at) >= since).length;
}

function fmtHours(h: number) {
  if (h === 0) return "0h";
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h.toFixed(1)}h`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string | null) {
  if (!iso) return null;
  // Date-only or midnight entries have no time component — don't show a time
  if (/T00:00:00/.test(iso) || !/T\d{2}:\d{2}/.test(iso)) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function sourceLabel(source: string | null) {
  if (source === "ai_quick_log") return "AI";
  if (source === "manual") return "Manual";
  if (source === "email") return "Email";
  return null;
}

type StatCardProps = { label: string; week: string; month: string; year: string };
function StatCard({ label, week, month, year }: StatCardProps) {
  return (
    <div className="card p-4">
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#8FB3CC", textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0B2942" }}>{week}</div>
          <div style={{ fontSize: 11, color: "#8FB3CC", marginTop: 2 }}>This week</div>
        </div>
        <div style={{ borderLeft: "1.5px solid #DBE3EA", borderRight: "1.5px solid #DBE3EA" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0B2942" }}>{month}</div>
          <div style={{ fontSize: 11, color: "#8FB3CC", marginTop: 2 }}>This month</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0B2942" }}>{year}</div>
          <div style={{ fontSize: 11, color: "#8FB3CC", marginTop: 2 }}>This year</div>
        </div>
      </div>
    </div>
  );
}

export default async function TripsPage() {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [boatId, { data: boats }] = await Promise.all([
    getSelectedBoatId(),
    supabase.from("boats").select("id, name").eq("user_id", user.id).order("created_at"),
  ]);

  const boat = boats?.find((b) => b.id === boatId) ?? boats?.[0] ?? null;

  let trips: TripRow[] = [];
  if (boat) {
    const { data } = await supabase
      .from("trips")
      .select("id, started_at, ended_at, engine_hours_delta, fuel_added_litres, notes, source")
      .eq("boat_id", boat.id)
      .order("started_at", { ascending: false, nullsFirst: false });
    trips = (data ?? []) as TripRow[];
  }

  // Build 12-month engine-hours chart data
  const now = new Date();
  const chartBars = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const hours = trips
      .filter((t) => {
        if (!t.started_at || t.engine_hours_delta == null) return false;
        const td = new Date(t.started_at);
        return td.getUTCFullYear() === y && td.getUTCMonth() === m;
      })
      .reduce((s, t) => s + (t.engine_hours_delta ?? 0), 0);
    return {
      label: d.toLocaleDateString(undefined, { month: "short" }),
      hours: Math.round(hours * 10) / 10,
      isCurrent: y === now.getUTCFullYear() && m === now.getUTCMonth(),
    };
  });

  const weekStart = startOf("week");
  const monthStart = startOf("month");
  const yearStart = startOf("year");

  const engineHours = {
    week: fmtHours(sumEngineHours(trips, weekStart)),
    month: fmtHours(sumEngineHours(trips, monthStart)),
    year: fmtHours(sumEngineHours(trips, yearStart)),
  };

  const timeOnWater = {
    week: fmtHours(sumDurationHours(trips, weekStart)),
    month: fmtHours(sumDurationHours(trips, monthStart)),
    year: fmtHours(sumDurationHours(trips, yearStart)),
  };

  const tripCount = {
    week: String(countTrips(trips, weekStart)),
    month: String(countTrips(trips, monthStart)),
    year: String(countTrips(trips, yearStart)),
  };

  return (
    <main className="space-y-5">
      {/* Navy page hero */}
      <div className="w-full px-4 pt-5 pb-5" style={{ background: "#0B2942" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>Trips</h1>
            {boat && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{boat.name}</p>}
          </div>
          {boat && <AddTripButton boatId={boat.id} />}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Engine hours chart */}
        <EngineHoursChart bars={chartBars} />

        {/* Stats */}
        <div className="space-y-3">
          <StatCard
            label="Engine hours"
            week={engineHours.week}
            month={engineHours.month}
            year={engineHours.year}
          />
          <StatCard
            label="Time on water"
            week={timeOnWater.week}
            month={timeOnWater.month}
            year={timeOnWater.year}
          />
          <StatCard
            label="Trips logged"
            week={tripCount.week}
            month={tripCount.month}
            year={tripCount.year}
          />
        </div>

        {/* Trip list */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: "1.5px solid #DBE3EA" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0B2942" }}>All trips</span>
            <span style={{ fontSize: 13, color: "#8FB3CC", marginLeft: 8 }}>{trips.length} total</span>
          </div>

          {trips.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ fontSize: 14, color: "#8FB3CC" }}>
              No trips logged yet. Head to the chat to log your first trip.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#DBE3EA" }}>
              {trips.map((trip) => {
                const startTime = fmtTime(trip.started_at);
                const endTime = fmtTime(trip.ended_at);
                const src = sourceLabel(trip.source);
                return (
                  <li key={trip.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0B2942" }}>
                          {fmtDate(trip.started_at)}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5" style={{ fontSize: 12, color: "#8FB3CC" }}>
                          {(startTime || endTime) && (
                            <span>
                              {startTime ?? "—"}
                              {endTime ? ` – ${endTime}` : ""}
                            </span>
                          )}
                          {trip.engine_hours_delta != null && (
                            <span>{trip.engine_hours_delta}h engine</span>
                          )}
                          {trip.fuel_added_litres != null && (
                            <span>{trip.fuel_added_litres}L fuel used</span>
                          )}
                        </div>
                        {trip.notes && (
                          <div className="mt-1 line-clamp-2" style={{ fontSize: 12, color: "#8FB3CC" }}>{trip.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {src && (
                          <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 700, background: "#E6F3FA", color: "#0B7EB8" }}>
                            {src}
                          </span>
                        )}
                        <EditTripButton
                          tripId={trip.id}
                          boatId={boat!.id}
                          startedAt={trip.started_at}
                          endedAt={trip.ended_at}
                          engineHoursDelta={trip.engine_hours_delta}
                          fuelAddedLitres={trip.fuel_added_litres}
                          notes={trip.notes}
                        />
                        <DeleteTripButton tripId={trip.id} />
                      </div>
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
