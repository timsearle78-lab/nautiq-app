import { NextResponse } from "next/server";

// Voice transcription requires an audio-capable API not currently configured.
export async function POST() {
  return NextResponse.json(
    { error: "Voice input is not available at this time." },
    { status: 501 }
  );
}
