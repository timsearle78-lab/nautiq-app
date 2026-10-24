import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow overriding recipient via body, default to calling admin
  let recipient = user.email!;
  try {
    const body = await req.json();
    if (body.email) recipient = body.email;
  } catch { /* use default */ }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "NautIQ <noreply@nautiq.cloud>",
      to: recipient,
      subject: "[TEST] We miss you on NautIQ — quick check-in 👋",
      html: inactiveEmail(recipient, 17),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: recipient });
}

function inactiveEmail(userEmail: string, daysSince: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We miss you on NautIQ</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0F2335;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">⚓ NautIQ</p>
            <p style="margin:6px 0 0;font-size:13px;color:#7BADC8;">Your boat management companion</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0F2335;font-weight:600;">Hey there — we miss you on board! 👋</p>

            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
              It's been about <strong>${daysSince} days</strong> since we've seen any activity on your NautIQ account. We just wanted to check in and make sure everything is OK.
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              Your free early-adopter subscription is active — but to keep it going, we do need to see you using the app. <strong>If we don't see any activity in the next few weeks, we may need to free up your subscription for another boatie on the waitlist.</strong>
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#0B7EB8;border-radius:10px;">
                  <a href="https://app.nautiq.cloud" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.1px;">
                    Open NautIQ →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
              We'd also love to hear from you:
            </p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#334155;line-height:1.8;">
              <li>Is there anything getting in the way of using the app?</li>
              <li>Is there a feature that's missing or not working for you?</li>
              <li>Is there anything we could do to make NautIQ more useful for your boat?</li>
            </ul>

            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              Just hit reply to this email — your feedback goes directly to the NautIQ team and genuinely shapes what we build next.
            </p>

            <p style="margin:0;font-size:15px;color:#334155;">
              See you on the water,<br />
              <strong style="color:#0F2335;">The NautIQ Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
              You're receiving this because you signed up for early access to NautIQ.<br />
              <a href="https://app.nautiq.cloud" style="color:#0B7EB8;text-decoration:none;">app.nautiq.cloud</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
