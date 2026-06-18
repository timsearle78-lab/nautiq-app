import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

// Schema for what the model actually generates — no derived/constant fields
const aiOutputSchema = z.object({
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

export type TripDraft = z.infer<typeof aiOutputSchema> & {
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

  const { object } = await generateObject({
    model: groq("llama-3.3-70b-versatile"),
    providerOptions: { groq: { structuredOutputs: false } },
    schema: aiOutputSchema,
    system:
      "You extract structured boat trip logs from user notes. Respond with valid json. " +
      "Be conservative. Never invent values. " +
      "If a value is unclear, return null. " +
      "Fuel added means fuel topped up, not fuel consumed. " +
      "Only return engine_hours_start or engine_hours_end if an actual meter reading is clearly present. " +
      "Only return engine_hours_delta if motoring duration is explicit or strongly implied. " +
      "If start and end readings are both present, return both plus the delta. " +
      `Today's date is ${currentDate}. The user's timezone is ${timezone}. ` +
      "IMPORTANT: If the user mentions a departure or start time, set started_at to a full ISO datetime using today's date. " +
      "IMPORTANT: If the user mentions an arrival, return, or end time, set ended_at to a full ISO datetime using today's date. " +
      "Always use today's date when no explicit date is given. " +
      "Do not fabricate timestamps, hour readings, or fuel values. " +
      "Summarise the trip cleanly in notes while preserving the factual meaning of the input.",
    prompt: rawInput,
  });

  return normaliseTripDraft({ ...object, raw_input: rawInput, source: "ai_quick_log" });
}
