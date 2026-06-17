import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
          },
          {
            type: "text",
            text: `You are scanning a boat parts / marine supplies photo. This could be:
- A product label or packaging
- A receipt or invoice
- A physical item

Extract inventory information and respond with ONLY valid JSON:
{
  "itemName": "short descriptive name of the item (e.g. 'Engine oil', 'Fuel filter', 'Impeller')",
  "quantity": <number, best guess, default 1>,
  "unit": "L or ea or kg etc, or null",
  "transactionType": "add",
  "notes": "any other useful info like brand or part number, or null",
  "confidence": "high|medium|low"
}

If you cannot identify a marine spare part or supply, return: {"error": "not_recognized"}`,
          },
        ],
      },
    ],
    max_tokens: 200,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "parse_failed", raw });
  }
}
