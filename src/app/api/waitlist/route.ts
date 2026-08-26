import { NextResponse } from "next/server";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://nautiq.cloud",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

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
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422, headers: CORS_HEADERS });
  }

  if (ADMIN_EMAILS.length === 0 || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }

  const signedAt = new Date().toLocaleString("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "NautIQ <noreply@nautiq.cloud>",
      to: ADMIN_EMAILS,
      subject: `New waitlist signup: ${email}`,
      html: `
        <p style="font-family:system-ui,sans-serif;font-size:15px;color:#0B2942;">
          Someone just signed up for early access to NautIQ.
        </p>
        <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;margin-top:12px;">
          <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Email</td><td style="color:#0B2942;font-weight:600;">${email}</td></tr>
          <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Signed up</td><td style="color:#0B2942;">${signedAt} (NZT)</td></tr>
          <tr><td style="color:#8FB3CC;padding:4px 16px 4px 0;">Source</td><td style="color:#0B2942;">nautiq.cloud waitlist</td></tr>
        </table>
      `,
    }),
  });

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
