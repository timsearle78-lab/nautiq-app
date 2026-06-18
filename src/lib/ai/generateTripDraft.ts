import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const tripDraftSchema = z.object({
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  engine_hours_delta: z.number().nullable(),
  engine_hours_start: z.number().nullable(),
  engine_hours_end: z.number().nullable(),
  fuel_added_litres: z.number().nullable(),
  notes: z.string(),
  raw_input: z.string(),
  issues_observed: z.array(z.string()),
  source: z.literal("ai_quick_log"),
  confidence: z.number().min(0).max(1),
});

export type TripDraft = z.infer<typeof tripDraftSchema>;

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

  const { object } = await generateObject({
    model: groq("llama-3.3-70b-versatile"),
    schema: tripDraftSchema,
    system:
      "You extract structured boat trip logs from user notes. " +
      "Be conservative. Never invent values. " +
      "If a value is unclear, return null. " +
      "Fuel added means fuel topped up, not fuel consumed. " +
      "Only return engine_hours_start or engine_hours_end if an actual meter reading is clearly present. " +
      "Only return engine_hours_delta if motoring duration is explicit or strongly implied. " +
      "If start and end readings are both present, return both plus the delta. " +
      "If the user provides times but no date, assume today's date in the user's local timezone. " +
      `Today's date is ${currentDate}. The user's timezone is ${timezone}. ` +
      "Return ISO datetime strings when a time can be inferred confidently. " +
      "Do not fabricate timestamps, hour readings, or fuel values. " +
      "Summarise the trip cleanly in notes while preserving the factual meaning of the input.",
    prompt: rawInput,
  });

  return normaliseTripDraft({ ...object, raw_input: rawInput, source: "ai_quick_log" });
}
