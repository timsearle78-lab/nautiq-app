import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export async function GET() {
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return Response.json({ ok: false, step: "env", error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  if (!key.startsWith("gsk_")) {
    return Response.json({ ok: false, step: "env", error: "GROQ_API_KEY looks invalid (should start with gsk_)" }, { status: 500 });
  }

  try {
    const { text } = await generateText({
      model: createGroq({ apiKey: key })("llama-3.3-70b-versatile"),
      prompt: "Reply with only the word OK.",
      maxOutputTokens: 5,
      abortSignal: AbortSignal.timeout(8000),
    });
    return Response.json({ ok: true, response: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, step: "api_call", error: message }, { status: 500 });
  }
}
