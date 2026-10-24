import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`feedback:${ip}`, 5, 60 * 60 * 1000)) {
    return tooManyRequests();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const score = Number(body.score);
  const comment = (body.comment ?? "").trim();

  if (!score || score < 1 || score > 10) {
    return NextResponse.json({ error: "score must be 1–10" }, { status: 400 });
  }

  if (ADMIN_EMAILS.length === 0) {
    return NextResponse.json({ error: "No ADMIN_EMAILS configured" }, { status: 500 });
  }

  const scoreEmoji = score >= 9 ? "🟢" : score >= 7 ? "🟡" : "🔴";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NautIQ Feedback</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0F2335;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">⚓ NautIQ Feedback</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">From</p>
            <p style="margin:0 0 20px;font-size:15px;color:#0F2335;font-weight:600;">${user.email}</p>

            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">NPS Score</p>
            <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:#0F2335;">${scoreEmoji} ${score} / 10</p>

            ${comment ? `
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Comments</p>
            <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;white-space:pre-wrap;">${comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            ` : `<p style="margin:0;font-size:14px;color:#94a3b8;font-style:italic;">No additional comments.</p>`}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "NautIQ <noreply@nautiq.cloud>",
      to: ADMIN_EMAILS,
      subject: `NautIQ Feedback — ${score}/10 from ${user.email}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
