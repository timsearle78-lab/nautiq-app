import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export async function GET() {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ ok: false, error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  try {
    const { text } = await generateText({
      model: createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile"),
      prompt: "Reply with only the word OK.",
      maxOutputTokens: 5,
    });
    return Response.json({ ok: true, response: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
