export async function GET() {
  return new Response(JSON.stringify({ ok: true, groqKey: !!process.env.GROQ_API_KEY }), {
    headers: { "Content-Type": "application/json" },
  });
}
