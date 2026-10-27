import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function getPeriodEnd(sub: Stripe.Subscription): string {
  // In Stripe API 2025+, period end is on the subscription item
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const ts = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : new Date().toISOString();
}

function getInterval(sub: Stripe.Subscription): string | undefined {
  const item = sub.items?.data?.[0];
  // price.recurring is the stable way across API versions
  return item?.price?.recurring?.interval ?? (item as unknown as { plan?: { interval?: string } })?.plan?.interval;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook error: ${err instanceof Error ? err.message : "unknown"}`, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || session.mode !== "subscription") break;

      const stripeSubId = session.subscription as string;
      const stripeCustomerId = session.customer as string;

      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      const interval = getInterval(stripeSub);
      const plan = interval === "year" ? "active_annual" : "active_monthly";

      await supabase
        .from("subscriptions")
        .update({
          plan,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubId,
          current_period_ends_at: getPeriodEnd(stripeSub),
          trial_ends_at: null,
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.user_id;
      if (!userId) break;

      const interval = getInterval(stripeSub);
      let plan: string;

      if (stripeSub.status === "active") {
        plan = interval === "year" ? "active_annual" : "active_monthly";
      } else if (stripeSub.status === "canceled") {
        plan = "cancelled";
      } else if (stripeSub.status === "past_due" || stripeSub.status === "unpaid") {
        plan = "expired";
      } else {
        break;
      }

      await supabase
        .from("subscriptions")
        .update({ plan, current_period_ends_at: getPeriodEnd(stripeSub) })
        .eq("stripe_subscription_id", stripeSub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ plan: "cancelled", current_period_ends_at: getPeriodEnd(stripeSub) })
        .eq("stripe_subscription_id", stripeSub.id);
      break;
    }
  }

  return Response.json({ received: true });
}
