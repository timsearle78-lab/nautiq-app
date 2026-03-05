"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [boatName, setBoatName] = useState("Manhattan");
  const [boatType, setBoatType] = useState("Sailboat");
  const [status, setStatus] = useState("");

  const createBoat = async () => {
    setStatus("Creating boat...");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login?next=/onboarding");
      return;
    }

    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .insert({ user_id: user.id, name: boatName, type: boatType })
      .select()
      .single();

    if (boatError) return setStatus(`Boat error: ${boatError.message}`);

    const { error: seedError } = await supabase.rpc("seed_boat_templates", {
      p_boat_id: boat.id,
    });

    if (seedError) return setStatus(`Seed error: ${seedError.message}`);

    setStatus("Done. Redirecting...");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Set up your boat</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input value={boatName} onChange={(e) => setBoatName(e.target.value)} placeholder="Boat name" />
        <input value={boatType} onChange={(e) => setBoatType(e.target.value)} placeholder="Boat type" />
        <button onClick={createBoat}>Create boat</button>

        <p><b>Status:</b> {status}</p>
      </div>
    </div>
  );
}