import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

const schema = z.object({
  engine_hours: z.number().nullable(),
  rpm: z.number().nullable(),
  engine_running: z.boolean().nullable(),
  warnings: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: base64, mediaType },
            {
              type: "text",
              text: "Read this boat engine panel image and extract the visible engine hour meter reading. Use null for unknown numeric values and [] for no warnings. Do not guess unreadable digits.",
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Engine hours AI error", error);
    const message = error instanceof Error ? error.message : "Failed to read engine panel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
