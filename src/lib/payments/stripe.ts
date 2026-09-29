import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only Stripe client (STRIPE_SECRET_KEY, never NEXT_PUBLIC_). Null when not configured. */
export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000, appInfo: { name: "northframe" } });
  return client;
};

export const stripeConfigured = () => getStripe() !== null;
