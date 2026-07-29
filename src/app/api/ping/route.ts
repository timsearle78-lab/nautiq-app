export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, googleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY, ts: Date.now() });
}
