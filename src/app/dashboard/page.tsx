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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  noStore();

  const params = await searchParams;
  const selectedBoatId = params.boat;

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard");

  const { data: boats, error } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Error loading boats: {error.message}</p>
      </div>
    );
  }

  if (!boats || boats.length === 0) redirect("/onboarding");

  const boat =
    boats.find((b) => b.id === selectedBoatId) ?? boats[0];

  const { data: health } = await supabase.rpc("get_boat_health", {
    p_boat_id: boat.id,
  });

	const avgRisk =
		health && health.length > 0
		? health.reduce((sum, r) => sum + Number(r.risk_score), 0) / health.length
		: 0;

	const boatHealthScore = Math.max(0, Math.round(100 - avgRisk));

	const { data: trips } = await supabase
		.from("trips")
		.select("started_at, engine_hours_delta, notes")
		.eq("boat_id", boat.id)
		.order("started_at", { ascending: false })
		.limit(5);

	const { data: totalEngineHours } = await supabase.rpc("get_boat_engine_hours", {
		p_boat_id: boat.id,
	});

	const lastTrip = trips && trips.length > 0 ? trips[0] : null;

	const getStatusColor = (status: string) => {
	  switch (status) {
		case "overdue":
		  return "red";
		case "due soon":
		  return "orange";
		case "ok":
		  return "green";
		default:
		  return "#666";
	  }
	};

  return (
    <div style={{ padding: 24 }}>
		<h1>Dashboard</h1>
		<p>Signed in.</p>

		<div style={{ marginBottom: 16 }}>
		  <strong>Active boat:</strong>{" "}
		  {boats.map((b) => (
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
        <Link href={`/trips?boat=${boat.id}`}>Log Trip</Link>
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
                  <strong>Engine hours:</strong> {Number(totalEngineHours ?? 0).toFixed(1)}
                </div>
                <div>
                  <strong>Last trip:</strong>{" "}
                  {lastTrip
                    ? new Date(lastTrip.started_at).toLocaleDateString()
                    : "No trips logged"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {boatHealthScore > 80
                    ? "Healthy"
                    : boatHealthScore > 60
                    ? "Needs attention soon"
                    : "Needs attention"}
                </div>
              </div>
            </div>
		</div>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <RecentActivityCard boatId={boat.id} />
            <MissingCriticalSparesCard boatId={boat.id} />
        </div>        

		<h3>Top Risks</h3>
		{health && health.length > 0 ? (
		  <ul>
			{health.slice(0, 10).map((r) => (
			  <li key={r.component_id} style={{ marginBottom: 12 }}>
				<div>
				  {r.system_name} — {r.component_name}
				</div>

				<div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
				  <span style={{ color: getStatusColor(r.status), fontWeight: 600 }}>
					{r.status}
				  </span>
				  {r.hours_since_service !== null && (
					<> • {Math.round(r.hours_since_service)}h since service</>
				  )}
				  {r.hours_until_due !== null && (
					<> • {Math.round(r.hours_until_due)}h until due</>
				  )}
				  {r.months_until_due !== null && (
					<> • {r.months_until_due} months until due</>
				  )}
				</div>

				<form
				  action={async () => {
					"use server";
					const supabase = await createClient();
					await supabase.rpc("log_component_service", {
					  p_component_id: r.component_id,
					});

					const { revalidatePath } = await import("next/cache");
					revalidatePath(`/dashboard?boat=${boat.id}`);
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
		<ul>
		  {health
			?.filter((r) => r.months_until_due > 0 || r.hours_until_due > 0)
			.sort((a, b) => {
			  const aDue =
				a.hours_until_due !== null ? a.hours_until_due : (a.months_until_due ?? 9999) * 100;
			  const bDue =
				b.hours_until_due !== null ? b.hours_until_due : (b.months_until_due ?? 9999) * 100;
			  return aDue - bDue;
			})
			.slice(0, 3)
			.map((r) => (
			  <li key={r.component_id}>
				{r.system_name} — {r.component_name}
				{r.hours_until_due !== null
				  ? ` (due in ${Math.round(r.hours_until_due)}h)`
				  : r.months_until_due !== null
				  ? ` (due in ${r.months_until_due} months)`
				  : ""}
			  </li>
			))}
		</ul>

		<h3>Recent Trips</h3>
		{trips && trips.length > 0 ? (
		  <ul>
			{trips.map((t, i) => (
			  <li key={i}>
				{new Date(t.started_at).toLocaleDateString()} —{" "}
				{t.engine_hours_delta ?? 0}h
				{t.notes && <> • {t.notes}</>}
			  </li>
			))}
		  </ul>
		) : (
		  <p>No trips logged yet.</p>
		)}

    </div>
  );
}