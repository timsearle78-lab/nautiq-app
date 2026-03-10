import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tripDraftSchema = {
  name: "trip_draft",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      started_at: { type: ["string", "null"] },
      ended_at: { type: ["string", "null"] },
      engine_hours_delta: { type: ["number", "null"] },
      fuel_added_litres: { type: ["number", "null"] },
      notes: { type: "string" },
      issues_observed: {
        type: "array",
        items: { type: "string" },
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
      "fuel_added_litres",
      "notes",
      "issues_observed",
      "confidence",
    ],
  },
  strict: true,
} as const;

export async function generateTripDraftFromAI(rawInput: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

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
              "Engine hours delta should be estimated only from explicit or strongly implied motoring duration.",
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

  return JSON.parse(response.output_text);
}