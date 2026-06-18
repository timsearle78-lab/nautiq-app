import { NextResponse } from "next/server";

// Voice input uses the browser Web Speech API — this route is not called.
export async function POST() {
  return NextResponse.json(
    { error: "Voice transcription endpoint not in use." },
    { status: 501 }
  );
}
