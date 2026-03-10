import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";
import QuickLogTextInput from "@/components/quick-log-text-input";

type QuickLogPageProps = {
  searchParams: Promise<{ boat?: string; draft?: string; fallback?: string; raw_input?: string; started_at?: string; ended_at?: string; engine_hours_delta?: string; fuel_added_litres?: string; notes?: string }>;
};

type BoatRow = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
};

type DraftValues = {
  started_at: string;
  ended_at: string;
  engine_hours_delta: string;
  fuel_added_litres: string;
  notes: string;
  raw_input: string;
};

function parseTripText(input: string) {
  const text = input.toLowerCase();

  const engineHoursMatch =
    text.match(/about\s+(\d+(\.\d+)?)\s*(hour|hours|hr|hrs)\b/) ||
    text.match(/(\d+(\.\d+)?)\s*(hour|hours|hr|hrs)\b/);

  const fuelMatch =
    text.match(/diesel\s+(\d+(\.\d+)?)\s*(l|litre|litres|liter|liters)\b/) ||
    text.match(/(\d+(\.\d+)?)\s*(l|litre|litres|liter|liters)\b/);

  const rpmMatch = text.match(/(\d{3,4})\s*rpm\b/);

  const now = new Date();
  const endedAt = new Date(now);
  endedAt.setSeconds(0, 0);

  const startedAt = new Date(endedAt);

  const engineHoursDelta = engineHoursMatch
    ? Number(engineHoursMatch[1])
    : null;

  if (engineHoursDelta != null && !Number.isNaN(engineHoursDelta)) {
    startedAt.setTime(
      endedAt.getTime() - engineHoursDelta * 60 * 60 * 1000
    );
  }

  const fuelAddedLitres = fuelMatch ? Number(fuelMatch[1]) : null;

  const notesParts = [input.trim()];
  if (rpmMatch) {
    notesParts.push(`Reported RPM: ${rpmMatch[1]}`);
  }

  return {
    started_at:
      engineHoursDelta != null ? toLocalDateTimeInputValue(startedAt) : "",
    ended_at: toLocalDateTimeInputValue(endedAt),
    engine_hours_delta:
      engineHoursDelta != null && !Number.isNaN(engineHoursDelta)
        ? engineHoursDelta
        : null,
    fuel_added_litres:
      fuelAddedLitres != null && !Number.isNaN(fuelAddedLitres)
        ? fuelAddedLitres
        : null,
    notes: notesParts.join("\n"),
  };
}

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function generateTripDraft(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/trips/log");
  }

  const boatId = String(formData.get("boat_id") ?? "");
  const rawInput = String(formData.get("raw_input") ?? "").trim();

  if (!boatId) {
    throw new Error("Boat is required.");
  }

  if (!rawInput) {
    throw new Error("Trip description is required.");
  }

  let draft: {
    started_at: string | null;
    ended_at: string | null;
    engine_hours_delta: number | null;
    fuel_added_litres: number | null;
    notes: string;
  };
  let usedFallback = false;

  try {
    const aiDraft = await generateTripDraftFromAI(rawInput);

    const combinedNotes = [
      aiDraft.notes ?? "",
      Array.isArray(aiDraft.issues_observed) && aiDraft.issues_observed.length > 0
        ? `Issues observed: ${aiDraft.issues_observed.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    draft = {
      started_at: aiDraft.started_at ?? "",
      ended_at: aiDraft.ended_at ?? "",
      engine_hours_delta: aiDraft.engine_hours_delta ?? null,
      fuel_added_litres: aiDraft.fuel_added_litres ?? null,
      notes: combinedNotes || rawInput,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      draft = parseTripText(rawInput);
      usedFallback = true;
    } else {
      throw error;
    }
  }

  const query = new URLSearchParams({
    boat: boatId,
    draft: "1",
    fallback: usedFallback ? "1" : "0",
    raw_input: rawInput,
    started_at: draft.started_at ?? "",
    ended_at: draft.ended_at ?? "",
    engine_hours_delta:
      draft.engine_hours_delta != null ? String(draft.engine_hours_delta) : "",
    fuel_added_litres:
      draft.fuel_added_litres != null ? String(draft.fuel_added_litres) : "",
    notes: draft.notes ?? "",
  });

  redirect(`/trips/log?${query.toString()}`);
}

async function saveTrip(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/trips/log");
  }

  const boatId = String(formData.get("boat_id") ?? "");
  const rawInput = String(formData.get("raw_input") ?? "").trim();
  const startedAt = String(formData.get("started_at") ?? "").trim();
  const endedAt = String(formData.get("ended_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const engineHoursDeltaRaw = String(
    formData.get("engine_hours_delta") ?? ""
  ).trim();
  const fuelAddedLitresRaw = String(
    formData.get("fuel_added_litres") ?? ""
  ).trim();

  const engineHoursDelta =
    engineHoursDeltaRaw === "" ? null : Number(engineHoursDeltaRaw);
  const fuelAddedLitres =
    fuelAddedLitresRaw === "" ? null : Number(fuelAddedLitresRaw);

  if (!boatId) {
    throw new Error("Boat is required.");
  }

  if (
    engineHoursDelta !== null &&
    (Number.isNaN(engineHoursDelta) || engineHoursDelta < 0)
  ) {
    throw new Error("Engine hours delta must be a valid positive number.");
  }

  if (
    fuelAddedLitres !== null &&
    (Number.isNaN(fuelAddedLitres) || fuelAddedLitres < 0)
  ) {
    throw new Error("Fuel added must be a valid positive number.");
  }

  const insertPayload: Record<string, unknown> = {
    boat_id: boatId,
    notes: notes || rawInput || null,
    source: "ai_quick_log",
    raw_input: rawInput || null,
    engine_hours_delta: engineHoursDelta,
  };

  if (startedAt) insertPayload.started_at = startedAt;
  if (endedAt) insertPayload.ended_at = endedAt;
  if (fuelAddedLitres !== null) {
    insertPayload.fuel_added_litres = fuelAddedLitres;
  }

  const { error } = await supabase.from("trips").insert(insertPayload);

  if (error) {
    throw new Error(`Failed to save trip: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard?boat=${boatId}`);
  revalidatePath("/trips");
  revalidatePath(`/trips?boat=${boatId}`);
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance?boat=${boatId}`);
  revalidatePath("/planner");
  revalidatePath(`/planner?boat=${boatId}`);

  redirect(`/trips?boat=${boatId}`);
}

export default async function QuickLogTripPage({
  searchParams,
}: QuickLogPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/trips/log");
  }

  const { data: boatsData, error: boatsError } = await supabase
    .from("boats")
    .select("id,name,type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (boatsError) {
    throw new Error(`Failed to load boats: ${boatsError.message}`);
  }

  const boats = (boatsData ?? []) as BoatRow[];

  if (boats.length === 0) {
    redirect("/onboarding");
  }

  const selectedBoat = boats.find((b) => b.id === params.boat) ?? boats[0];

  const isDraft = params.draft === "1";
  const usedFallback = params.fallback === "1";

  const draftValues: DraftValues = {
    raw_input: params.raw_input ?? "",
    started_at: params.started_at ?? "",
    ended_at: params.ended_at ?? "",
    engine_hours_delta: params.engine_hours_delta ?? "",
    fuel_added_litres: params.fuel_added_litres ?? "",
    notes: params.notes ?? "",
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Quick Log Trip</h1>
        <p className="text-sm text-neutral-600">
          Describe the trip in plain language. NautIQ will draft a structured
          trip log for review before saving.
        </p>
      </section>

      <section className="rounded-xl border p-4">
        <form action={generateTripDraft} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Boat</label>
            <select
              name="boat_id"
              defaultValue={selectedBoat.id}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {boats.map((boat) => (
                <option key={boat.id} value={boat.id}>
                  {boat.name}
                </option>
              ))}
            </select>
          </div>

          <QuickLogTextInput defaultValue={draftValues.raw_input} />

          <button
            type="submit"
            className="rounded-md border bg-black px-4 py-2 text-sm text-white"
          >
            Generate trip draft
          </button>
        </form>
      </section>

      {isDraft && (
        <section className="rounded-xl border p-4">
          {usedFallback && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              AI trip parsing is temporarily unavailable, so NautIQ used the
              basic parser instead. Review the draft carefully before saving.
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-lg font-semibold">Review trip draft</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Check the fields below, edit anything needed, then save.
            </p>
          </div>

          <form action={saveTrip} className="space-y-4">
            <input type="hidden" name="boat_id" value={selectedBoat.id} />
            <input type="hidden" name="raw_input" value={draftValues.raw_input} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Started at
                </label>
                <input
                  type="datetime-local"
                  name="started_at"
                  defaultValue={draftValues.started_at}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Ended at
                </label>
                <input
                  type="datetime-local"
                  name="ended_at"
                  defaultValue={draftValues.ended_at}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Engine hours used
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="engine_hours_delta"
                  defaultValue={draftValues.engine_hours_delta}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Fuel added (litres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="fuel_added_litres"
                  defaultValue={draftValues.fuel_added_litres}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <QuickLogTextInput defaultValue={draftValues.raw_input} />

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md border bg-black px-4 py-2 text-sm text-white"
              >
                Save trip
              </button>

              <a
                href={`/trips/log?boat=${selectedBoat.id}`}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Start over
              </a>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}