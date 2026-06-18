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
  issues_observed: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type TripDraft = z.infer<typeof tripDraftSchema> & {
  raw_input: string;
  source: "ai_quick_log";
};

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
    model: groq("llama-3.3-70b-versatile"),
    system:
      `You extract structured boat trip logs from user notes. Today is ${currentDate} (${timezone}).` +
      "\n\nRules:" +
      "\n- Convert all times to 24-hour ISO 8601. 1pm = 13:00, 3pm = 15:00, 12pm = 12:00, 12am = 00:00." +
      "\n- Use today's date for started_at/ended_at when no explicit date is given." +
      "\n- Only set engine_hours_delta when motoring duration is explicit (e.g. '30 minutes motoring' = 0.5)." +
      "\n- fuel_added_litres means fuel topped up, not consumed. Null if not mentioned." +
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
      "\n  \"issues_observed\": [\"<issue>\"]," +
      "\n  \"confidence\": <0-1>" +
      "\n}",
    prompt: rawInput,
  });

  // Strip markdown fences if model wraps in ```json...```
  const json = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = tripDraftSchema.parse(JSON.parse(json));

  return normaliseTripDraft({ ...parsed, raw_input: rawInput, source: "ai_quick_log" });
}
