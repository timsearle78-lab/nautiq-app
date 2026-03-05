"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [boatName, setBoatName] = useState("Manhattan");
  const [boats, setBoats] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) fetchBoats();
    };
    load();
  }, []);

  const signUp = async () => {
    setStatus("Signing up...");
    const { error } = await supabase.auth.signUp({ email, password });
    setStatus(error ? `Error: ${error.message}` : "Signed up. You are logged in (confirm email is off).");
    if (!error) fetchBoats();
  };

  const signIn = async () => {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? `Error: ${error.message}` : "Signed in.");
    if (!error) fetchBoats();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setBoats([]);
    setStatus("Signed out.");
  };

  const fetchBoats = async () => {
    const { data, error } = await supabase.from("boats").select("*").order("created_at", { ascending: false });
    if (error) setStatus(`Error: ${error.message}`);
    else setBoats(data ?? []);
  };

	const createBoat = async () => {
	  setStatus("Creating boat...");

	  const { data: userData } = await supabase.auth.getUser();
	  const user = userData.user;

	  if (!user) {
		setStatus("Not logged in.");
		return;
	  }

	  // 1️⃣ Create boat
	  const { data: boatData, error: boatError } = await supabase
		.from("boats")
		.insert({
		  user_id: user.id,
		  name: boatName,
		  type: "Sailboat",
		})
		.select()
		.single();

	  if (boatError) {
		setStatus(`Boat error: ${boatError.message}`);
		return;
	  }

	  // 2️⃣ Call RPC to seed systems/components
	  const { error: seedError } = await supabase.rpc(
		"seed_boat_templates",
		{ p_boat_id: boatData.id }
	  );

	  if (seedError) {
		setStatus(`Seed error: ${seedError.message}`);
		return;
	  }

	  setStatus("Boat created + templates seeded.");
	  fetchBoats();
	};

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1>Supabase Test</h1>

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={signUp}>Sign up</button>
          <button onClick={signIn}>Sign in</button>
          <button onClick={signOut}>Sign out</button>
          <button onClick={fetchBoats}>Refresh boats</button>
        </div>

        <hr />

        <input placeholder="boat name" value={boatName} onChange={(e) => setBoatName(e.target.value)} />
        <button onClick={createBoat}>Create boat</button>

        <p><b>Status:</b> {status}</p>

        <h3>Boats (RLS-protected)</h3>
        <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(boats, null, 2)}
        </pre>
      </div>
    </div>
  );
}