import "server-only";
import Stripe from "stripe";
import { supabasePaymentsRepo, type PaymentsRepo } from "@/lib/payments/repo";

/** User-safe failure: the message may be shown to the person who triggered the action. */
export class PaymentError extends Error {}

let client: Stripe | null = null;

/** Lazy singleton. Throws a clean error when the secret key is missing (never logs the key). */
export const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new PaymentError("Payments are not configured yet.");
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
  return client;
};

/** Everything the payment logic touches, injectable for tests. */
export type PaymentsDeps = {
  repo: PaymentsRepo;
  stripe: Stripe;
  now: () => Date;
  /** Public origin for Checkout return URLs. */
  origin: string;
};

const defaultOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return (/^https?:\/\//i.test(configured) ? configured : `https://${configured}`).replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? "https://northframe.co" : "http://localhost:3000";
};

export const defaultDeps = (): PaymentsDeps => ({
  repo: supabasePaymentsRepo(),
  stripe: getStripe(),
  now: () => new Date(),
  origin: defaultOrigin(),
});
