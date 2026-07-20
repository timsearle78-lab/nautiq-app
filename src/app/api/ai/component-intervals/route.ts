import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const intervalSchema = z.object({
  service_interval_months: z.coerce.number().nullable().default(null),
  service_interval_years: z.coerce.number().nullable().default(null),
  service_interval_engine_hours: z.coerce.number().nullable().default(null),
  reasoning: z.string().default(""),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  servicing_steps: z.array(z.string()).default([]),
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
      system: "You are a marine maintenance expert. Respond ONLY with a single valid JSON object — no markdown, no explanation, no extra text.",
      prompt: `A boat owner is adding a component called "${componentName.trim()}"${boatType ? ` to their ${boatType}` : ""}.

Return a JSON object with these exact keys:
- service_interval_months: number or null
- service_interval_years: number or null
- service_interval_engine_hours: number or null
- reasoning: one short sentence string
- confidence: "high", "medium", or "low"
- servicing_steps: array of 3-6 short strings, each a key servicing step

Example for "Raw water impeller":
{"service_interval_months":12,"service_interval_years":null,"service_interval_engine_hours":200,"reasoning":"Replace annually or every 200 engine hours, whichever comes first.","confidence":"high","servicing_steps":["Close the seacock before starting","Remove the pump cover and extract the old impeller","Inspect the pump housing for scoring or wear","Lubricate the new impeller with dish soap before fitting","Refit the cover and open the seacock","Run the engine briefly and check for leaks"]}`,
    });

    // Parse JSON — try direct parse first, fall back to extraction
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[^]*\}/);
      if (!match) {
        console.error("[component-intervals] No JSON found in:", text);
        return Response.json({ error: "Could not parse AI response" }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    const result = intervalSchema.parse(parsed);
    // Convert steps array to bullet-point string for the notes field
    const servicing_notes = result.servicing_steps.map((s) => `• ${s}`).join("\n");
    return Response.json({ ...result, servicing_notes });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const isRateLimit = msg.includes("rate limit") || msg.includes("rate_limit") ||
      msg.includes("429") || msg.includes("quota") || msg.includes("daily");
    console.error("[component-intervals]", err);
    return Response.json(
      { error: isRateLimit ? "RATE_LIMIT" : "AI lookup failed" },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
