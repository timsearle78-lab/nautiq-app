import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

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

      // Fetch the full subscription to get period end and interval
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      const interval = stripeSub.items.data[0]?.plan.interval;
      const plan = interval === "year" ? "active_annual" : "active_monthly";

      await supabase
        .from("subscriptions")
        .update({
          plan,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubId,
          current_period_ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
          trial_ends_at: null,
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const userId = stripeSub.metadata?.user_id;
      if (!userId) break;

      const interval = stripeSub.items.data[0]?.plan.interval;
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
        .update({
          plan,
          current_period_ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", stripeSub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          plan: "cancelled",
          current_period_ends_at: new Date(stripeSub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", stripeSub.id);
      break;
    }
  }

  return Response.json({ received: true });
}
