import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const INACTIVE_DAYS = 14;

async function sendResend(payload: object) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
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
          <td style="background:#0F2335;padding:24px 32px;text-align:center;">
            <img src="https://nautiq.cloud/images/logo-email.jpg" alt="NautIQ" style="height:48px;width:auto;display:block;margin:0 auto;" />
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

            <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
              We'd love to hear from you. Once you're back in the app you can share feedback in two quick ways:
            </p>
            <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#334155;line-height:1.8;">
              <li><strong>Tell the assistant</strong> — just type or say what's on your mind on the Home screen.</li>
              <li><strong>Profile menu</strong> — tap your profile icon (top right) and choose <strong>Share feedback</strong> to rate us and leave a comment.</li>
            </ul>

            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              Your feedback goes directly to the NautIQ team and genuinely shapes what we build next.
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

export async function GET(req: Request) {
  // Secured with a shared secret set as CRON_SECRET env var
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

  // Get all users with any audit activity in the last 14 days
  const { data: recentActivity } = await adminClient
    .from("audit_events")
    .select("user_id")
    .gte("created_at", cutoff.toISOString());

  const activeUserIds = new Set((recentActivity ?? []).map((r: { user_id: string }) => r.user_id));

  // Get all auth users
  const { data: { users: authUsers }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Filter to users who have not been active in 14 days
  // and whose account is at least 14 days old (give new users a grace period)
  const inactiveUsers = authUsers.filter((u) => {
    if (activeUserIds.has(u.id)) return false;
    const created = new Date(u.created_at);
    return created < cutoff;
  });

  if (inactiveUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No inactive users found" });
  }

  // Filter out users who have unsubscribed from all emails
  const userIds = inactiveUsers.map((u) => u.id);
  const { data: unsubscribedRows } = await adminClient
    .from("user_settings")
    .select("user_id")
    .in("user_id", userIds)
    .eq("email_unsubscribed", true);
  const unsubscribedIds = new Set((unsubscribedRows ?? []).map((r: { user_id: string }) => r.user_id));
  const eligibleUsers = inactiveUsers.filter((u) => !unsubscribedIds.has(u.id));

  if (eligibleUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No eligible users (all inactive users have unsubscribed)" });
  }

  // For each eligible user, calculate days since last audit event
  const { data: lastActivity } = await adminClient
    .from("audit_events")
    .select("user_id, created_at")
    .in("user_id", eligibleUsers.map((u) => u.id))
    .order("created_at", { ascending: false });

  const lastSeenMap = new Map<string, Date>();
  for (const row of lastActivity ?? []) {
    if (!lastSeenMap.has(row.user_id)) {
      lastSeenMap.set(row.user_id, new Date(row.created_at));
    }
  }

  let sent = 0;
  const results: { email: string; status: string }[] = [];

  for (const user of eligibleUsers) {
    const email = user.email;
    if (!email) continue;

    const lastSeen = lastSeenMap.get(user.id);
    const reference = lastSeen ?? new Date(user.created_at);
    const daysSince = Math.floor((Date.now() - reference.getTime()) / (1000 * 60 * 60 * 24));

    const ok = await sendResend({
      from: "NautIQ <noreply@nautiq.cloud>",
      to: email,
      bcc: ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS : undefined,
      subject: "We miss you on NautIQ — quick check-in 👋",
      html: inactiveEmail(email, daysSince),
    });

    results.push({ email, status: ok ? "sent" : "failed" });
    if (ok) sent++;
  }

  return NextResponse.json({ ok: true, sent, total: inactiveUsers.length, results });
}
