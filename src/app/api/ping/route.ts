export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, anthropicKey: !!process.env.ANTHROPIC_API_KEY, ts: Date.now() });
}
