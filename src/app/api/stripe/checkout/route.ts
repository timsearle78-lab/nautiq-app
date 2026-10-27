import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PRICE_LOOKUP_KEYS } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { interval } = await req.json() as { interval: "monthly" | "annual" };

  // Get subscription to check early adopter status and existing Stripe customer
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, early_adopter")
    .eq("user_id", user.id)
    .maybeSingle();

  const isEarlyAdopter = sub?.early_adopter ?? false;

  const lookupKey = interval === "annual"
    ? (isEarlyAdopter ? STRIPE_PRICE_LOOKUP_KEYS.annual_early : STRIPE_PRICE_LOOKUP_KEYS.annual_standard)
    : (isEarlyAdopter ? STRIPE_PRICE_LOOKUP_KEYS.monthly_early : STRIPE_PRICE_LOOKUP_KEYS.monthly_standard);

  // Look up the price by lookup key
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], expand: ["data.product"] });
  const price = prices.data[0];

  if (!price) {
    return Response.json({ error: "Price not found. Please contact support." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.nautiq.cloud";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: price.id, quantity: 1 }],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    subscription_data: {
      trial_period_days: undefined, // trial already tracked in our DB
      metadata: { user_id: user.id },
    },
    metadata: { user_id: user.id },
    success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/subscribe`,
  });

  return Response.json({ url: session.url });
}
