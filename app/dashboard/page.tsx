import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login?next=/dashboard");

  const { data: boats, error } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Error loading boats: {error.message}</p>
      </div>
    );
  }

  // If no boats, send user to onboarding
  if (!boats || boats.length === 0) redirect("/onboarding");
  
  const boat = boats[0];

const { data: health } = await supabase.rpc("get_boat_health", {
  p_boat_id: boat.id,
});

const avgRisk =
  health && health.length > 0
    ? health.reduce((sum, r) => sum + Number(r.risk_score), 0) / health.length
    : 0;

const boatHealthScore = Math.max(0, Math.round(100 - avgRisk));
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Signed in.</p>

<h2
  style={{
    color:
      boatHealthScore > 80
        ? "green"
        : boatHealthScore > 60
        ? "orange"
        : "red",
  }}
>
  Boat Health: {boatHealthScore}/100
</h2>


		<h3>Your boats</h3>
		<ul>
			{boats.map((b) => (
			  <li key={b.id}>
				{b.name} {b.type ? `(${b.type})` : ""}
			  </li>
			))}
		</ul>
		<h3>Top Risks</h3>
		<ul>
		  {health?.slice(0,3).map((r) => (
			<li key={r.component_id}>
			  {r.system_name} — {r.component_name}
			  {" "}({r.status})
			</li>
		  ))}
		</ul>
    </div>
  );
}