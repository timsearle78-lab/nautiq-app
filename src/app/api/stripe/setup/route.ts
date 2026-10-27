import { stripe, STRIPE_PRICE_LOOKUP_KEYS } from "@/lib/stripe";

// One-time setup endpoint — creates Stripe products and prices with lookup keys
// Call once via: POST /api/stripe/setup?secret=<CRON_SECRET>
// Safe to call multiple times — lookup keys prevent duplicates
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Ensure product exists
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find((p) => p.name === "NautIQ");
  if (!product) {
    product = await stripe.products.create({
      name: "NautIQ",
      description: "Boat maintenance and trip tracking",
    });
  }

  const pricesToCreate = [
    { lookupKey: STRIPE_PRICE_LOOKUP_KEYS.monthly_standard, amount: 499, interval: "month" as const, nickname: "Monthly Standard" },
    { lookupKey: STRIPE_PRICE_LOOKUP_KEYS.annual_standard,  amount: 4999, interval: "year" as const,  nickname: "Annual Standard" },
    { lookupKey: STRIPE_PRICE_LOOKUP_KEYS.monthly_early,    amount: 299,  interval: "month" as const, nickname: "Monthly Early Adopter" },
    { lookupKey: STRIPE_PRICE_LOOKUP_KEYS.annual_early,     amount: 2999, interval: "year" as const,  nickname: "Annual Early Adopter" },
  ];

  const results: Record<string, string> = {};

  for (const p of pricesToCreate) {
    const existing = await stripe.prices.list({ lookup_keys: [p.lookupKey] });
    if (existing.data.length > 0) {
      results[p.lookupKey] = existing.data[0].id;
    } else {
      const created = await stripe.prices.create({
        product: product.id,
        unit_amount: p.amount,
        currency: "usd",
        recurring: { interval: p.interval },
        lookup_key: p.lookupKey,
        nickname: p.nickname,
        transfer_lookup_key: true,
      });
      results[p.lookupKey] = created.id;
    }
  }

  return Response.json({ ok: true, productId: product.id, prices: results });
}
