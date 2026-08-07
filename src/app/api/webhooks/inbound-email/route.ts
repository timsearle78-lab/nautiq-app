import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the service-role client so we can look up users by email and insert drafts
// bypassing RLS (the webhook runs outside of a user session).
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Verify the Resend webhook signature so only Resend can call this endpoint.
async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return true;
    console.error("RESEND_WEBHOOK_SECRET is not configured");
    return false;
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(toSign));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return svixSignature.split(" ").some((s) => s.replace(/^v1,/, "") === computed);
}

type MaintenanceParsed = {
  type: "maintenance";
  component_name: string | null;
  work_done: string | null;
  performed_at: string | null;
  engine_hours: number | null;
  vendor: string | null;
  notes: string | null;
};

type TripParsed = {
  type: "trip";
  started_at: string | null;
  ended_at: string | null;
  engine_hours: number | null;
  fuel_litres: number | null;
  notes: string | null;
  issues: string | null;
};

type ParsedEmail = MaintenanceParsed | TripParsed;

async function parseEmailWithAI(subject: string, body: string): Promise<ParsedEmail> {
  const maintenanceEmpty: MaintenanceParsed = { type: "maintenance", component_name: null, work_done: null, performed_at: null, engine_hours: null, vendor: null, notes: null };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return maintenanceEmpty;

  const today = new Date().toISOString().slice(0, 10);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Classify and extract details from this boat log email. Today is ${today}.

Subject: ${subject}
Body:
${body}

First decide if this email is logging a TRIP (went out on the water, motor run, sailing) or MAINTENANCE (service, repair, replacement, inspection of a component).

If TRIP, return ONLY this JSON:
{
  "type": "trip",
  "started_at": "ISO datetime YYYY-MM-DDTHH:MM:00 or YYYY-MM-DD if time unknown, or today's date if 'today'/'this morning' etc., or null",
  "ended_at": "ISO datetime or null",
  "engine_hours": number of engine hours run (not total hours) or null,
  "fuel_litres": litres of fuel added or null,
  "notes": "destination, route, conditions, or other trip details, or null",
  "issues": "any problems observed during the trip, or null"
}

If MAINTENANCE, return ONLY this JSON:
{
  "type": "maintenance",
  "component_name": "name of the component or part serviced (e.g. 'Impeller', 'Engine oil', 'Standing rigging')",
  "work_done": "short description of the work performed (e.g. 'Replaced impeller', 'Oil change')",
  "performed_at": "ISO date YYYY-MM-DD when the work was done, or today if only 'today' or 'this morning' etc.",
  "engine_hours": total engine hours at time of service or null,
  "vendor": "who did the work or where parts were bought, or null",
  "notes": "any extra details worth keeping, or null"
}`,
        },
      ],
    }),
  });

  if (!res.ok) return maintenanceEmpty;

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return maintenanceEmpty;

  try {
    return JSON.parse(match[0]) as ParsedEmail;
  } catch {
    return maintenanceEmpty;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const valid = await verifySignature(req, rawBody);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract email_id from webhook envelope
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const emailId = data.email_id as string | undefined;
  if (!emailId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  // Only process emails addressed to log@nautiq.cloud
  const receivedFor = (data.received_for as string[] | undefined) ?? [];
  const isForLogAddress = receivedFor.some((addr) => addr.toLowerCase() === "log@nautiq.cloud");
  if (!isForLogAddress) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Fetch full email content from Resend API
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const emailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${resendKey}` },
  });
  const emailResText = await emailRes.text();
  if (!emailRes.ok) {
    console.error("Failed to fetch email from Resend:", emailRes.status, emailResText);
    return NextResponse.json({ error: "Failed to retrieve email", status: emailRes.status, detail: emailResText, emailId }, { status: 500 });
  }

  const email = JSON.parse(emailResText) as Record<string, unknown>;
  const from: string = (email.from as string) ?? (data.from as string) ?? "";
  const subject: string = (email.subject as string) ?? (data.subject as string) ?? "";
  const text: string = (email.text as string) ?? "";
  const html: string = (email.html as string) ?? "";

  // Strip HTML to plain text as fallback; fall back to subject alone if no body
  const body = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || subject;

  if (!from) {
    return NextResponse.json({ error: "Missing from" }, { status: 400 });
  }

  // Extract sender email from "Name <email>" format
  const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/([^\s]+@[^\s]+)/);
  const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : from.toLowerCase();

  const supabase = adminClient();

  // Look up user by email in auth.users
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Failed to list users:", usersError.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === senderEmail);
  if (!user) {
    // Not a registered user — silently accept (don't expose user existence)
    return NextResponse.json({ ok: true });
  }

  // Get the user's active boat (first boat)
  const { data: boats } = await supabase
    .from("boats")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const boatId = boats?.[0]?.id ?? null;

  // Parse the email with AI
  const parsed = await parseEmailWithAI(subject, body);

  let insertError;

  if (parsed.type === "trip") {
    ({ error: insertError } = await supabase.from("trip_drafts").insert({
      user_id: user.id,
      boat_id: boatId,
      email_from: senderEmail,
      email_subject: subject,
      email_body: body.slice(0, 4000),
      parsed_started_at: parsed.started_at,
      parsed_ended_at: parsed.ended_at,
      parsed_engine_hours: parsed.engine_hours,
      parsed_fuel_litres: parsed.fuel_litres,
      parsed_notes: parsed.notes,
      parsed_issues: parsed.issues,
    }));
  } else {
    ({ error: insertError } = await supabase.from("maintenance_drafts").insert({
      user_id: user.id,
      boat_id: boatId,
      email_from: senderEmail,
      email_subject: subject,
      email_body: body.slice(0, 4000),
      parsed_component_name: parsed.component_name,
      parsed_work_done: parsed.work_done,
      parsed_performed_at: parsed.performed_at,
      parsed_engine_hours: parsed.engine_hours,
      parsed_vendor: parsed.vendor,
      parsed_notes: parsed.notes,
    }));
  }

  if (insertError) {
    console.error("Failed to insert draft:", insertError.message);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, draftType: parsed.type });
}
