import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const intervalSchema = z.object({
  service_interval_months: z.number().nullable().describe("Recommended service interval in months, or null if not time-based"),
  service_interval_years: z.number().nullable().describe("Recommended service interval in years, or null if not applicable"),
  service_interval_engine_hours: z.number().nullable().describe("Recommended service interval in engine hours, or null if not applicable"),
  reasoning: z.string().describe("Brief explanation of why this interval is recommended, one sentence"),
  confidence: z.enum(["high", "medium", "low"]).describe("How confident you are in this recommendation"),
});

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { componentName, boatType } = await req.json();
  if (!componentName?.trim()) {
    return Response.json({ error: "Component name required" }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile"),
      schema: intervalSchema,
      prompt: `You are a marine maintenance expert. A boat owner is adding a component called "${componentName.trim()}"${boatType ? ` to their ${boatType}` : ""}.

Provide the standard recommended service interval for this marine component based on manufacturer guidelines and industry best practices.

Rules:
- Use months for time-based intervals (e.g. 12 months for annual, 6 for semi-annual)
- Use engine hours for engine/mechanical components that wear with use
- Many components need BOTH a time interval AND an engine hour interval — provide both when applicable
- If a component doesn't require regular service (e.g. a cleat), return null for all intervals
- Be specific and practical — a boat owner should be able to act on this
- Keep reasoning to one short sentence

Examples:
- "Engine oil" → 12 months / 100 engine hours
- "Raw water impeller" → 12 months / 200 engine hours
- "Fuel filter" → 12 months / 200 engine hours
- "Safety flares" → 36 months (expiry date)
- "Bilge pump" → null (inspect regularly, no fixed interval)`,
    });

    return Response.json(object);
  } catch (err) {
    console.error("[component-intervals]", err);
    return Response.json({ error: "AI lookup failed" }, { status: 500 });
  }
}
