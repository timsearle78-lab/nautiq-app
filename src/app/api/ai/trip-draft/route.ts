import { NextRequest, NextResponse } from "next/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawInput = String(body?.raw_input ?? "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Trip description is required." },
        { status: 400 }
      );
    }

    const draft = await generateTripDraftFromAI(rawInput);
    return NextResponse.json(draft);
  } catch (error) {
    console.error("AI trip draft error", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate AI trip draft.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}