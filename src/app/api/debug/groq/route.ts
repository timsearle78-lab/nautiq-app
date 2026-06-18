export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const key = process.env.GROQ_API_KEY;

  // Step 1: just check env — no imports needed
  if (!key) {
    return new Response(JSON.stringify({ ok: false, step: "env", error: "GROQ_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      step: "env",
      keyPrefix: key.substring(0, 8),
      message: "Key found. AI call not tested yet.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
