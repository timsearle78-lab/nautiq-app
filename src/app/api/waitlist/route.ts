import { NextResponse } from "next/server";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

// CORS is handled by the middleware (proxy.ts) — do NOT set these headers here
// too, or the browser will see duplicates and reject the response.
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  // 5 signups per IP per hour
  if (!rateLimit(`waitlist:${getClientIp(req)}`, 5, 60 * 60 * 1000)) {
    return tooManyRequests(CORS_HEADERS);
  }

  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Invalid email" }, 422);
  }

  if (ADMIN_EMAILS.length === 0 || !process.env.RESEND_API_KEY) {
    console.warn("[waitlist] ADMIN_EMAILS or RESEND_API_KEY not configured — skipping email");
    return json({ ok: true });
  }

  const signedAt = new Date().toLocaleString("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const adminHtml = `
    <p style="font-family:system-ui,sans-serif;font-size:15px;color:#0B2942;">
      Someone just signed up for early access to NautIQ.
    </p>
    <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;margin-top:12px;">
      <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Email</td><td style="color:#0B2942;font-weight:600;">${email}</td></tr>
      <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Signed up</td><td style="color:#0B2942;">${signedAt} (NZT)</td></tr>
      <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Source</td><td style="color:#0B2942;">nautiq.cloud waitlist</td></tr>
    </table>
  `;

  const confirmationHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="background:#0B2942;padding:32px 40px;text-align:center;">
        <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Naut<span style="color:#FFC730;">IQ</span></span>
      </div>
      <div style="padding:32px 40px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0B2942;">You're on the list!</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#4A6480;line-height:1.6;">
          Thanks for your interest in NautIQ. We'll be in touch as soon as early access opens — you'll be among the first to know.
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#4A6480;line-height:1.6;">
          NautIQ is an AI-powered boat management app that helps you track maintenance, log trips, and manage your inventory — all in one place.
        </p>
      </div>
      <div style="padding:16px 40px 32px;border-top:1px solid #E8EFF5;">
        <p style="margin:0;font-size:12px;color:#8FB3CC;text-align:center;">
          NautIQ · <a href="https://nautiq.cloud" style="color:#8FB3CC;text-decoration:none;">nautiq.cloud</a>
        </p>
      </div>
    </div>
  `;

  const [adminRes, confirmRes] = await Promise.all([
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "NautIQ <noreply@nautiq.cloud>",
        to: ADMIN_EMAILS,
        subject: `New waitlist signup: ${email}`,
        html: adminHtml,
      }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "NautIQ <noreply@nautiq.cloud>",
        to: [email],
        subject: "You're on the NautIQ waitlist",
        html: confirmationHtml,
      }),
    }),
  ]);

  if (!adminRes.ok) {
    const err = await adminRes.text();
    console.error("[waitlist] Resend admin error:", adminRes.status, err);
    return json({ error: "Failed to send notification" }, 502);
  }

  if (!confirmRes.ok) {
    // Log but don't fail — admin was notified, confirmation is best-effort
    const err = await confirmRes.text();
    console.error("[waitlist] Resend confirmation error:", confirmRes.status, err);
  }

  return json({ ok: true });
}
