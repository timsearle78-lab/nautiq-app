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

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Signed in.</p>

      <h3>Your boats</h3>
      <ul>
        {boats.map((b) => (
          <li key={b.id}>
            {b.name} {b.type ? `(${b.type})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}