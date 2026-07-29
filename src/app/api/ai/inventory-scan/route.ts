import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: base64, mediaType },
            {
              type: "text",
              text: `You are an inventory scanning assistant for a boat. The user may photograph any physical item they want to track — marine parts, safety gear, tools, personal items, clothing, food, drinks, or anything else kept on board.

Identify what the item is and respond with ONLY valid JSON (no markdown, no explanation):
{
  "itemName": "short descriptive name (e.g. 'Polarised sunglasses', 'Engine oil', 'Life jacket', 'Sunscreen SPF50')",
  "quantity": <number, best guess from packaging/label, default 1>,
  "unit": "choose the most appropriate: L | mL | ea | kg | g | m | pair | set | roll | box | can | tube | bottle — or null if unknown. Use 'pair' for items that come in pairs (sunglasses, gloves). Use 'ea' for single countable items. Use 'L' for liquids.",
  "category": "choose one: Engine | Safety | Electrical | Plumbing | Rigging | Navigation | Deck | Consumables | Personal | Tools | Other — or null",
  "manufacturer": "brand name if visible, or null",
  "sku": "part number or model number if visible on label, or null",
  "is_critical": <true only for safety-critical items: life jacket, flare, fire extinguisher, EPIRB, bilge pump, first aid kit>,
  "notes": "any other useful info, or null",
  "confidence": "high|medium|low"
}

If the image is completely unidentifiable (e.g. blank, too dark, not an item), return: {"error": "not_recognized"}`,
            },
          ],
        },
      ],
      maxOutputTokens: 200,
    });

    const parsed = JSON.parse(text.trim().replace(/```json\n?|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "parse_failed" });
  }
}
