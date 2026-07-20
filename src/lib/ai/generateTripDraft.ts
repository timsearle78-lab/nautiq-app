import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const tripDraftSchema = z.object({
  started_at: z.string().nullable().default(null),
  ended_at: z.string().nullable().default(null),
  engine_hours_delta: z.number().nullable().default(null),
  engine_hours_start: z.number().nullable().default(null),
  engine_hours_end: z.number().nullable().default(null),
  fuel_added_litres: z.number().nullable().default(null),
  notes: z.string().default(""),
  issues_observed: z.array(z.string()).nullable().default([]).transform(v => v ?? []),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type TripDraft = z.infer<typeof tripDraftSchema> & {
  raw_input: string;
  source: "ai_quick_log";
};

// If the model used the wrong date (not today), replace with today's date
function fixDate(iso: string | null, correctDate: string): string | null {
  if (!iso) return iso;
  const datePart = iso.slice(0, 10);
  if (datePart === correctDate) return iso;
  return correctDate + iso.slice(10);
}

// Fix 12-hour PM times the model converted incorrectly (e.g. 1pm → T01: instead of T13:)
function fixPmTimes(draft: TripDraft, rawInput: string): TripDraft {
  const pmHours = new Set<number>();
  const pmRe = /\b(\d{1,2})\s*(?:p\.m\.|p\.m|pm)(?!\w)/gi;
  let m;
  while ((m = pmRe.exec(rawInput)) !== null) {
    const h = parseInt(m[1]);
    if (h >= 1 && h <= 11) pmHours.add(h);
  }
  if (pmHours.size === 0) return draft;

  function fixIso(iso: string | null): string | null {
    if (!iso) return iso;
    const hourMatch = iso.match(/T(\d{2}):/);
    if (!hourMatch) return iso;
    const hour = parseInt(hourMatch[1]);
    if (pmHours.has(hour)) {
      return iso.replace(`T${hourMatch[1]}:`, `T${String(hour + 12).padStart(2, "0")}:`);
    }
    return iso;
  }

  return { ...draft, started_at: fixIso(draft.started_at), ended_at: fixIso(draft.ended_at) };
}

function normaliseTripDraft(draft: TripDraft): TripDraft {
  let engineHoursDelta = draft.engine_hours_delta;
  if (
    engineHoursDelta === null &&
    draft.engine_hours_start !== null &&
    draft.engine_hours_end !== null &&
    draft.engine_hours_end >= draft.engine_hours_start
  ) {
    engineHoursDelta = Number(
      (draft.engine_hours_end - draft.engine_hours_start).toFixed(2)
    );
  }
  return { ...draft, engine_hours_delta: engineHoursDelta };
}

export async function generateTripDraftFromAI(
  rawInput: string,
  context?: { currentDate: string; timezone: string }
): Promise<TripDraft> {
  const currentDate = context?.currentDate ?? new Date().toISOString().slice(0, 10);
  const timezone = context?.timezone ?? "Pacific/Auckland";

  const { text } = await generateText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    system:
      `You extract structured boat trip logs from user notes. Today is ${currentDate} (${timezone}).` +
      "\n\nRules:" +
      "\n- Convert all times to 24-hour ISO 8601. 1pm = 13:00, 3pm = 15:00, 12pm = 12:00, 12am = 00:00." +
      `\n- Always use today's date (${currentDate}) for started_at/ended_at when no explicit date is given.` +
      "\n- Only set engine_hours_delta when motoring duration is explicit (e.g. '30 minutes motoring' = 0.5)." +
      "\n- fuel_added_litres means fuel topped up, not consumed. Null if not mentioned." +
      "\n- issues_observed: list only real problems mentioned. Use [] when there are no issues." +
      "\n- Never invent values. Use null when uncertain." +
      "\n- Write a concise notes summary." +
      "\n\nRespond with ONLY a JSON object — no explanation, no markdown fences:" +
      "\n{" +
      "\n  \"started_at\": \"<ISO datetime or null>\"," +
      "\n  \"ended_at\": \"<ISO datetime or null>\"," +
      "\n  \"engine_hours_delta\": <number or null>," +
      "\n  \"engine_hours_start\": <number or null>," +
      "\n  \"engine_hours_end\": <number or null>," +
      "\n  \"fuel_added_litres\": <number or null>," +
      "\n  \"notes\": \"<summary>\"," +
      "\n  \"issues_observed\": []," +
      "\n  \"confidence\": <0-1>" +
      "\n}",
    prompt: rawInput,
  });

  const json = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = tripDraftSchema.parse(JSON.parse(json));

  const base: TripDraft = { ...parsed, raw_input: rawInput, source: "ai_quick_log" };
  const dateFixed: TripDraft = {
    ...base,
    started_at: fixDate(base.started_at, currentDate),
    ended_at: fixDate(base.ended_at, currentDate),
  };
  return normaliseTripDraft(fixPmTimes(dateFixed, rawInput));
}
