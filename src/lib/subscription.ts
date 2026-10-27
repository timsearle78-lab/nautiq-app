import { createClient } from "@/lib/supabase/server";
import { hasActiveAccess, type SubscriptionPlan } from "@/lib/supabase/proxy";

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  active: boolean;
  trialing: boolean;
  earlyAdopter: boolean;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
};

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, trial_ends_at, current_period_ends_at, early_adopter")
    .eq("user_id", userId)
    .maybeSingle();

  const plan = (data?.plan ?? "expired") as SubscriptionPlan;
  const trialEndsAt = data?.trial_ends_at ?? null;
  const currentPeriodEndsAt = data?.current_period_ends_at ?? null;

  return {
    plan,
    active: hasActiveAccess(plan, trialEndsAt, currentPeriodEndsAt),
    trialing: plan === "trialing" && trialEndsAt != null && new Date(trialEndsAt) > new Date(),
    earlyAdopter: data?.early_adopter ?? false,
    trialEndsAt,
    currentPeriodEndsAt,
  };
}
