export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, groqKey: !!process.env.GROQ_API_KEY, ts: Date.now() });
}
