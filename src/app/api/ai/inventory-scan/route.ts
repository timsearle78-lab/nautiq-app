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
              text: `You are scanning a boat parts / marine supplies photo. This could be a product label, packaging, receipt, or physical item.

Extract inventory information and respond with ONLY valid JSON (no markdown, no explanation):
{
  "itemName": "short descriptive name (e.g. 'Engine oil', 'Fuel filter', 'Life jacket', 'Impeller')",
  "quantity": <number, best guess from label/receipt, default 1>,
  "unit": "choose the most appropriate: L | mL | ea | kg | g | m | pair | set | roll | box | can | tube | bottle — or null if unknown. Use 'ea' for countable individual items (life jacket, filter, impeller, flare, etc). Use 'L' for liquid volume. Use 'can'/'tube'/'bottle' for packaged consumables.",
  "category": "choose one: Engine | Safety | Electrical | Plumbing | Rigging | Navigation | Deck | Consumables — or null",
  "manufacturer": "brand name if visible, or null",
  "sku": "part number or model number if visible on label, or null",
  "is_critical": <true if this is a safety or emergency item (life jacket, flare, fire extinguisher, EPIRB, bilge pump, etc), false otherwise>,
  "notes": "any other useful info not captured above, or null",
  "confidence": "high|medium|low"
}

If you cannot identify a marine spare part or supply, return: {"error": "not_recognized"}`,
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
