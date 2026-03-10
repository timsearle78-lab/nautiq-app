import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import BoatHealthGauge from "@/components/dashboard/BoatHealthGauge";
import { MissingCriticalSparesCard } from "@/components/dashboard/missing-critical-spares-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";

type DashboardPageProps = {
  searchParams: Promise<{ boat?: string }>;
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
};

type SparePredictionRow = {
  inventory_item_id: string;
  component_id: string | null;
  component_name: string | null;
  system_name: string | null;
  item_name: string;
  category: string | null;
  manufacturer: string | null;
  sku: string | null;
  quantity: number | null;
  minimum_quantity: number | null;
  shortage: number | null;
  predicted_status: "missing" | "low" | "needed_soon" | "ok";
  maintenance_status: string | null;
  predicted_due_date: string | null;
  recommendation: string | null;
  sort_rank: number;
};

type TripRow = {
  started_at: string;
  engine_hours_delta: number | null;
  notes: string | null;
};

function getStatusColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case "overdue":
      return "red";
    case "due soon":
      return "orange";
    case "ok":
      return "green";
    default:
      return "#666";
  }
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

    const { data: boatsData, error: boatsError } = await supabase
      .from("boats")
      .select("id,name,type,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

  if (boatsError) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Error loading boats: {boatsError.message}</p>
      </div>
    );
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) redirect("/onboarding");

  const boat = boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const [
    { data: healthData },
    { data: tripsData },
    { data: totalEngineHoursData },
    { data: timelineData },
    { data: sparesPredictionData },
  ] = await Promise.all([
    supabase.rpc("get_boat_health", {
      p_boat_id: boat.id,
    }),
    supabase
      .from("trips")
      .select("started_at, engine_hours_delta, notes")
      .eq("boat_id", boat.id)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_boat_engine_hours", {
      p_boat_id: boat.id,
    }),
    supabase.rpc("get_boat_maintenance_timeline", {
      p_boat_id: boat.id,
      p_horizon_days: 90,
    }),
    supabase.rpc("get_boat_critical_spares_prediction", {
      p_boat_id: boat.id,
      p_horizon_days: 90,
    }),
  ]);
  
  const timeline = (timelineData ?? []) as Array<{
    component_id: string;
    component_name: string;
    system_name: string | null;
    predicted_due_date: string | null;
    status: "overdue" | "due_soon" | "planned" | "later" | "unknown";
  }>;

  const predictiveItems = timeline
    .filter((row) => row.status === "overdue" || row.status === "due_soon" || row.status === "planned")
    .slice(0, 3);  

  const health = (healthData ?? []) as HealthRow[];
  const sortedHealth = [...health].sort((a, b) => {
    return Number(b.risk_score ?? 0) - Number(a.risk_score ?? 0);
  });
  const trips = (tripsData ?? []) as TripRow[];
  const totalEngineHours = Number(totalEngineHoursData ?? 0);

  const sparePredictions =
    (sparesPredictionData ?? []) as SparePredictionRow[];

  const missingSpares = sparePredictions.filter(
    (row) => row.predicted_status === "missing"
  );

  const lowSpares = sparePredictions.filter(
    (row) => row.predicted_status === "low"
  );

  const neededSoonSpares = sparePredictions.filter(
    (row) => row.predicted_status === "needed_soon"
  );
  
  const avgRisk =
    health.length > 0
      ? health.reduce((sum: number, row: HealthRow) => {
          return sum + Number(row.risk_score ?? 0);
        }, 0) / health.length
      : 0;

  const boatHealthScore = Math.max(0, Math.round(100 - avgRisk));
  const lastTrip = trips.length > 0 ? trips[0] : null;

const upcomingMaintenance = sortedHealth
    .filter((row: HealthRow) => row.status?.toLowerCase() !== "ok")
    .sort((a: HealthRow, b: HealthRow) => {
      const aDue =
        a.hours_until_due !== null
          ? a.hours_until_due
          : (a.months_until_due ?? 9999) * 100;
      const bDue =
        b.hours_until_due !== null
          ? b.hours_until_due
          : (b.months_until_due ?? 9999) * 100;
      return aDue - bDue;
    })
    .slice(0, 3);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Signed in.</p>

      <div style={{ marginBottom: 16 }}>
        <strong>Active boat:</strong>{" "}
        {boats.map((b: BoatRow) => (
          <Link
            key={b.id}
            href={`/dashboard?boat=${b.id}`}
            style={{
              marginLeft: 10,
              padding: "4px 8px",
              border: "1px solid #ccc",
              textDecoration: "none",
              background: b.id === boat.id ? "#eee" : "transparent",
            }}
          >
            {b.name}
          </Link>
        ))}
      </div>

<p>
  <Link href={`/trips?boat=${boat.id}`}>Trips</Link>
  {" · "}
  <Link href={`/trips/log?boat=${boat.id}`}>Quick Log Trip</Link>
  {" · "}
  <Link href={`/maintenance?boat=${boat.id}`}>Maintenance Overview</Link>
  {" · "}
  <Link href={`/planner?boat=${boat.id}`}>Maintenance Planner</Link>
  {" · "}
  <Link href={`/components?boat=${boat.id}`}>Components</Link>
</p>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>{boat.name}</h2>
        <p style={{ margin: "6px 0 12px 0", color: "#666" }}>
          {boat.type || "Boat"}
        </p>

        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <BoatHealthGauge score={boatHealthScore} />

          <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 220 }}>
            <div>
              <strong>Engine hours:</strong> {totalEngineHours.toFixed(1)}
            </div>
            <div>
              <strong>Last trip:</strong>{" "}
              {lastTrip
                ? new Date(lastTrip.started_at).toLocaleDateString()
                : "No trips logged"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {boatHealthScore >= 80
                ? "Healthy"
                : boatHealthScore >= 60
                ? "Needs attention soon"
                : "Needs attention"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2" style={{ marginBottom: 24 }}>
        <RecentActivityCard boatId={boat.id} />
        <MissingCriticalSparesCard boatId={boat.id} />
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Critical Spares Prediction</h3>
          <Link href={`/inventory?boat=${boat.id}`}>Open inventory</Link>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div>
            <strong>Missing now:</strong> {missingSpares.length}

            {missingSpares.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {missingSpares.slice(0, 3).map((row) => (
                  <li key={row.inventory_item_id}>
                    <Link href={`/inventory?boat=${boat.id}`}>
                      {row.item_name}
                    </Link>
                    {row.component_name ? ` — ${row.component_name}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>Low stock:</strong> {lowSpares.length}

            {lowSpares.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {lowSpares.slice(0, 3).map((row) => (
                  <li key={row.inventory_item_id}>
                    <Link href={`/inventory?boat=${boat.id}`}>
                      {row.item_name}
                    </Link>
                    {row.quantity != null && row.minimum_quantity != null
                      ? ` (${row.quantity}/${row.minimum_quantity})`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>Needed soon:</strong> {neededSoonSpares.length}

            {neededSoonSpares.length > 0 && (
              <ul style={{ marginTop: 8 }}>
                {neededSoonSpares.slice(0, 3).map((row) => (
                  <li key={row.inventory_item_id}>
                    <Link href={`/inventory?boat=${boat.id}`}>
                      {row.item_name}
                    </Link>
                    {row.predicted_due_date
                      ? ` • by ${new Date(row.predicted_due_date).toLocaleDateString()}`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Predictive Maintenance</h3>
          <Link href={`/maintenance?boat=${boat.id}`}>View all</Link>
        </div>

        {predictiveItems.length > 0 ? (
          <ul style={{ marginTop: 12 }}>
            {predictiveItems.map((row) => (
              <li key={row.component_id} style={{ marginBottom: 10 }}>
                <Link href={`/components/${row.component_id}`}>
                  {(row.system_name ?? "System") + " — " + row.component_name}
                </Link>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {row.status === "overdue"
                    ? "Overdue"
                    : row.status === "due_soon"
                    ? "Due soon"
                    : "Planned"}
                  {row.predicted_due_date
                    ? ` • ${new Date(row.predicted_due_date).toLocaleDateString()}`
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 12 }}>No predictive maintenance items.</p>
        )}
      </div>      

      <h3>Top Risks</h3>
      {health.length > 0 ? (
        <ul>
            {sortedHealth.slice(0, 10).map((row: HealthRow) => (
            <li key={row.component_id} style={{ marginBottom: 12 }}>
              <div>
                {row.system_name ?? "System"} — {row.component_name}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                <span
                  style={{
                    color: getStatusColor(row.status),
                    fontWeight: 600,
                  }}
                >
                  {row.status ?? "unknown"}
                </span>
                {row.hours_since_service !== null && (
                  <> • {Math.round(row.hours_since_service)}h since service</>
                )}
                {row.hours_until_due !== null && (
                  <> • {Math.round(row.hours_until_due)}h until due</>
                )}
                {row.months_until_due !== null && (
                  <> • {row.months_until_due} months until due</>
                )}
              </div>

              <form
                action={async () => {
                  "use server";
                  const supabase = await createClient();
                  await supabase.rpc("log_component_service", {
                    p_component_id: row.component_id,
                  });

                  const { revalidatePath } = await import("next/cache");
                  revalidatePath(`/dashboard?boat=${boat.id}`);
                  revalidatePath("/dashboard");
                  revalidatePath(`/components/${row.component_id}`);
                }}
                style={{ display: "inline-block", marginTop: 6 }}
              >
                <button type="submit">Log Service</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p>No component risk data yet.</p>
      )}

      <h3>Upcoming Maintenance</h3>
      {upcomingMaintenance.length > 0 ? (
        <ul>
          {upcomingMaintenance.map((row: HealthRow) => (
            <li key={row.component_id}>
              <Link href={`/components/${row.component_id}`}>
                {(row.system_name ?? "System") + " — " + row.component_name}
              </Link>
              {row.hours_until_due !== null
                ? ` (due in ${Math.round(row.hours_until_due)}h)`
                : row.months_until_due !== null
                ? ` (due in ${row.months_until_due} months)`
                : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p>No upcoming maintenance items.</p>
      )}

      <h3>Recent Trips</h3>
      {trips.length > 0 ? (
        <ul>
          {trips.map((trip: TripRow, index: number) => (
            <li key={`${trip.started_at}-${index}`}>
              {new Date(trip.started_at).toLocaleDateString()} —{" "}
              {trip.engine_hours_delta ?? 0}h
              {trip.notes && <> • {trip.notes}</>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No trips logged yet.</p>
      )}
    </div>
  );
}