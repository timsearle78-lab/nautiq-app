import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const VALID_PLANS = ["free_lifetime", "trialing", "active_monthly", "active_annual", "expired", "cancelled"];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, plan, earlyAdopter } = await req.json();

  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  if (plan && !VALID_PLANS.includes(plan)) return Response.json({ error: "Invalid plan" }, { status: 400 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const update: Record<string, unknown> = {};
  if (plan !== undefined) update.plan = plan;
  if (earlyAdopter !== undefined) update.early_adopter = earlyAdopter;

  const { error } = await adminClient
    .from("subscriptions")
    .update(update)
    .eq("user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
