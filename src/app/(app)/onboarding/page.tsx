"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Anchor } from "lucide-react";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [boatName, setBoatName] = useState("");
  const [boatType, setBoatType] = useState("Motorboat");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const createBoat = async () => {
    if (!boatName.trim()) {
      setStatus("Please enter a boat name.");
      return;
    }

    setLoading(true);
    setStatus("Setting up your boat…");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login?next=/onboarding");
      return;
    }

    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .insert({ user_id: user.id, name: boatName.trim(), type: boatType })
      .select()
      .single();

    if (boatError) {
      setStatus(`Error: ${boatError.message}`);
      setLoading(false);
      return;
    }

    const { error: seedError } = await supabase.rpc("seed_boat_templates", {
      p_boat_id: boat.id,
    });

    if (seedError) {
      setStatus(`Error: ${seedError.message}`);
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  const isError = status.startsWith("Error:") || status.startsWith("Please");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ocean-600 flex items-center justify-center mb-4">
            <Anchor size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Add your boat</h1>
          <p className="mt-2 text-sm text-slate-500">
            Let's get your boat set up so you can start tracking maintenance and trips.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 space-y-5">
          <div>
            <label htmlFor="boatName" className="mb-1.5 block text-sm font-medium text-slate-700">
              Boat name
            </label>
            <input
              id="boatName"
              type="text"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
              placeholder="Manhattan"
            />
          </div>

          <div>
            <label htmlFor="boatType" className="mb-1.5 block text-sm font-medium text-slate-700">
              Boat type
            </label>
            <select
              id="boatType"
              value={boatType}
              onChange={(e) => setBoatType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100"
            >
              <option>Motorboat</option>
              <option>Sailboat</option>
              <option>Catamaran</option>
              <option>Yacht</option>
              <option>RIB</option>
              <option>Other</option>
            </select>
          </div>

          <button
            onClick={createBoat}
            disabled={loading}
            className="w-full rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Setting up…" : "Create boat"}
          </button>

          {status && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-ocean-200 bg-ocean-50 text-ocean-700"
              }`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
