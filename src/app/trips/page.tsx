"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TripsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const selectedBoatId = searchParams.get("boat");

  const [engineHours, setEngineHours] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const logTrip = async () => {
    setStatus("Logging trip...");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setStatus(`User error: ${userError.message}`);
      return;
    }

    const user = userData.user;
    if (!user) {
      setStatus("Not logged in.");
      return;
    }

    if (!selectedBoatId) {
      setStatus("No active boat selected.");
      return;
    }

    const parsedEngineHours =
      engineHours.trim() === "" ? null : Number(engineHours);

    if (engineHours.trim() !== "" && Number.isNaN(parsedEngineHours)) {
      setStatus("Engine hours must be a number.");
      return;
    }

    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .select("id, name")
      .eq("id", selectedBoatId)
      .single();

    if (boatError || !boat) {
      setStatus("Selected boat not found.");
      return;
    }

    const { error: insertError } = await supabase.from("trips").insert({
      boat_id: boat.id,
      user_id: user.id,
      started_at: new Date().toISOString(),
      engine_hours_delta: parsedEngineHours,
      notes,
    });

    if (insertError) {
      setStatus(`Insert error: ${insertError.message}`);
      return;
    }

    setStatus(
      `Trip logged for ${boat.name} with ${parsedEngineHours ?? 0} engine hours.`
    );
    setEngineHours("");
    setNotes("");
  };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
        <a href={`/dashboard?boat=${selectedBoatId}`}>Back to Dashboard</a>
		<h1>Log Trip</h1>

        <p>
            Active boat ID: <code>{selectedBoatId ?? "none selected"}</code>
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="Engine hours"
          value={engineHours}
          onChange={(e) => setEngineHours(e.target.value)}
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />

        <button onClick={logTrip}>Save Trip</button>

        <p>
          <b>Status:</b> {status}
        </p>
      </div>
    </div>
  );
}