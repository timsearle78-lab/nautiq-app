import OpenAI from "openai";

const tripDraftSchema = {
  name: "trip_draft",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      started_at: { type: ["string", "null"] },
      ended_at: { type: ["string", "null"] },

      engine_hours_delta: { type: ["number", "null"] },
      engine_hours_start: { type: ["number", "null"] },
      engine_hours_end: { type: ["number", "null"] },

      fuel_added_litres: { type: ["number", "null"] },

      notes: { type: "string" },
      raw_input: { type: "string" },

      issues_observed: {
        type: "array",
        items: { type: "string" },
      },

      source: {
        type: "string",
        enum: ["ai_quick_log"],
      },

      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    },
    required: [
      "started_at",
      "ended_at",
      "engine_hours_delta",
      "engine_hours_start",
      "engine_hours_end",
      "fuel_added_litres",
      "notes",
      "raw_input",
      "issues_observed",
      "source",
      "confidence",
    ],
  },
  strict: true,
} as const;

export type TripDraft = {
  started_at: string | null;
  ended_at: string | null;
  engine_hours_delta: number | null;
  engine_hours_start: number | null;
  engine_hours_end: number | null;
  fuel_added_litres: number | null;
  notes: string;
  raw_input: string;
  issues_observed: string[];
  source: "ai_quick_log";
  confidence: number;
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

  return {
    ...draft,
    engine_hours_delta: engineHoursDelta,
  };
}

export async function generateTripDraftFromAI(
  rawInput: string,
  context?: {
    currentDate: string;
    timezone: string;
  }
): Promise<TripDraft> {
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const currentDate = context?.currentDate ?? new Date().toISOString().slice(0, 10);
  const timezone = context?.timezone ?? "Pacific/Auckland";  

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You extract structured boat trip logs from user notes. " +
              "Be conservative. Never invent values. " +
              "If a value is unclear, return null. " +
              "Fuel added means fuel topped up, not fuel consumed. " +
              "Only return engine_hours_start or engine_hours_end if an actual meter reading is clearly present. " +
              "Only return engine_hours_delta if motoring duration is explicit or strongly implied. " +
              "If start and end readings are both present, prefer returning both readings as well as the delta. " +
              "If the user provides times but no date, assume today's date in the user's local timezone. " +
              `Today's date is ${currentDate}. The user's timezone is ${timezone}. ` +
              "Return ISO datetime strings when a time can be inferred confidently. " +
              "Do not fabricate timestamps, hour readings, or fuel values. " +
              "Summarise the trip cleanly in notes while preserving the factual meaning of the input."
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: rawInput,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        ...tripDraftSchema,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as TripDraft;

  const normalised = normaliseTripDraft({
    ...parsed,
    raw_input: rawInput,
    source: "ai_quick_log",
  });

  return normalised;
}