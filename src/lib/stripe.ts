import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-09-30.endive",
});

// Price IDs — created on first call to ensureStripePrices()
// Store these in env vars once created, or we look them up by lookup_key each time
export const STRIPE_PRICE_LOOKUP_KEYS = {
  monthly_standard: "nautiq_monthly_standard",
  annual_standard: "nautiq_annual_standard",
  monthly_early: "nautiq_monthly_early",
  annual_early: "nautiq_annual_early",
} as const;
