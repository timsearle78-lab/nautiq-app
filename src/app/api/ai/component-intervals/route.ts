import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const intervalSchema = z.object({
  service_interval_months: z.number().nullable().default(null),
  service_interval_years: z.number().nullable().default(null),
  service_interval_engine_hours: z.number().nullable().default(null),
  reasoning: z.string().default(""),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  servicing_notes: z.string().default(""),
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
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are a marine maintenance expert. A boat owner is adding a component called "${componentName.trim()}"${boatType ? ` to their ${boatType}` : ""}.

Return ONLY valid JSON with the standard recommended service interval and servicing steps for this marine component.

Rules:
- Use months for time-based intervals (e.g. 12 for annual, 6 for semi-annual)
- Use engine hours for components that wear with use
- Provide BOTH time and engine-hour intervals when both apply
- If no regular service is needed, use null for all interval fields
- Keep reasoning to one short sentence
- servicing_notes: 3–6 concise bullet points (use "• " prefix) describing the key steps a boat owner should follow when servicing this component

JSON format (no markdown, no explanation, just the JSON object):
{
  "service_interval_months": <number or null>,
  "service_interval_years": <number or null>,
  "service_interval_engine_hours": <number or null>,
  "reasoning": "<one sentence>",
  "confidence": "<high|medium|low>",
  "servicing_notes": "<bullet points>"
}

Examples:
- "Raw water impeller" → {"service_interval_months":12,"service_interval_years":null,"service_interval_engine_hours":200,"reasoning":"Replace annually or every 200 engine hours.","confidence":"high","servicing_notes":"• Close the seacock before starting\n• Remove the pump cover and extract the old impeller\n• Inspect the pump housing for scoring or wear\n• Lubricate the new impeller with dish soap or vaseline before fitting\n• Refit the cover and open the seacock\n• Run the engine briefly and check for leaks"}`,
    });

    // Extract JSON from response (model may wrap in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[component-intervals] No JSON in response:", text);
      return Response.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const result = intervalSchema.parse(parsed);
    return Response.json(result);
  } catch (err) {
    console.error("[component-intervals]", err);
    return Response.json({ error: "AI lookup failed" }, { status: 500 });
  }
}
