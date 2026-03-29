import { NextRequest, NextResponse } from "next/server";
import { generateTripDraftFromAI } from "@/lib/ai/generateTripDraft";
import { createClient } from "@/lib/supabase/server";

const MAX_INPUT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse input
    const body = await request.json();
    const rawInput = String(body?.raw_input ?? "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Trip description is required." },
        { status: 400 }
      );
    }

    if (rawInput.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: "Trip description is too long." },
        { status: 400 }
      );
    }

    // 3. Generate draft
    const now = new Date();
    const currentDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const draft = await generateTripDraftFromAI(rawInput, {
      currentDate,
      timezone: "Pacific/Auckland",
    });

    // 4. Basic sanity guard (defensive)
    if (!draft || typeof draft !== "object") {
      throw new Error("Invalid AI response");
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("AI trip draft error", error);

    // 5. Graceful fallback (important)
    return NextResponse.json(
      {
        fallback: true,
        started_at: null,
        ended_at: null,
        engine_hours_delta: null,
        engine_hours_start: null,
        engine_hours_end: null,
        fuel_added_litres: null,
        notes: "",
        raw_input: "",
        issues_observed: [],
        source: "ai_quick_log",
        confidence: 0,
      },
      { status: 200 }
    );
  }
}