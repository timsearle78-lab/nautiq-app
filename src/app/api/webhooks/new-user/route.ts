import { NextResponse } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  // Verify shared secret set in the Supabase database webhook header
  const secret = req.headers.get("x-webhook-secret");
  const validSecret = process.env.WEBHOOK_SECRET ?? "internal";
  if (!secret || secret !== validSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { record?: { email?: string; created_at?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = body.record?.email ?? "unknown";
  const createdAt = body.record?.created_at
    ? new Date(body.record.created_at).toLocaleString("en-NZ", {
        timeZone: "Pacific/Auckland",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "unknown";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "NautIQ <noreply@nautiq.cloud>",
      to: ADMIN_EMAILS,
      subject: `New NautIQ signup: ${email}`,
      html: `
      <p style="font-family:system-ui,sans-serif;font-size:15px;color:#0F2335;">
        A new user just signed up for NautIQ.
      </p>
      <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;margin-top:12px;">
        <tr><td style="color:#6B8599;padding:4px 16px 4px 0;">Email</td><td style="color:#0F2335;font-weight:600;">${email}</td></tr>
        <tr><td style="color:#6B8599;padding:4px 16px 4px 0;">Signed up</td><td style="color:#0F2335;">${createdAt} (NZT)</td></tr>
      </table>
      <p style="font-family:system-ui,sans-serif;font-size:13px;color:#6B8599;margin-top:24px;">
        View all users at <a href="https://nautiq.cloud/admin" style="color:#0B7EB8;">nautiq.cloud/admin</a>
      </p>
    `,
    }),
  });

  return NextResponse.json({ ok: true });
}
