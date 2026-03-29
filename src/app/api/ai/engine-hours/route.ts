import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Read this boat engine panel image and extract the visible engine hour meter reading. " +
                "Return strict JSON with keys: engine_hours, rpm, engine_running, warnings. " +
                "Use null for unknown numeric values and [] for no warnings. " +
                "Do not guess unreadable digits.",
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "engine_panel_reading",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              engine_hours: { type: ["number", "null"] },
              rpm: { type: ["number", "null"] },
              engine_running: { type: ["boolean", "null"] },
              warnings: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["engine_hours", "rpm", "engine_running", "warnings"],
          },
        },
      },
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("Engine hours AI error", error);

    const message =
      error instanceof Error ? error.message : "Failed to read engine panel";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}