import "server-only";
import { headers } from "next/headers";
import Stripe from "stripe";
import { supabasePaymentsRepo, type PaymentsRepo } from "@/lib/payments/repo";

/** User-safe failure: the message may be shown to the person who triggered the action. */
export class PaymentError extends Error {}

let client: Stripe | null = null;

/** Lazy singleton. Throws a clean error when the secret key is missing (never logs the key). */
export const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new PaymentError("Payments are not configured yet.");
  if (!client) {
    client = new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
    // Mode only (never the key), so a live key in a test environment is obvious in the server log.
    console.info(`[stripe] using ${key.includes("_live_") ? "LIVE" : "test"} mode`);
  }
  return client;
};

/** Everything the payment logic touches, injectable for tests. */
export type PaymentsDeps = {
  repo: PaymentsRepo;
  stripe: Stripe;
  now: () => Date;
  /** Public origin for Checkout return URLs. Empty = derive it from the incoming request (see resolveOrigin). */
  origin: string;
};

const defaultOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return (/^https?:\/\//i.test(configured) ? configured : `https://${configured}`).replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? "https://northframe.co" : "http://localhost:3000";
};

/**
 * Where Stripe sends the customer back to. Uses the host the customer is actually on, so local,
 * preview and production each return to themselves, and falls back to the configured site URL when
 * there is no request (tests, scripts). Only http(s) hosts are accepted.
 */
export const resolveOrigin = async (deps: PaymentsDeps): Promise<string> => {
  if (deps.origin) return deps.origin;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
      const local = /^(localhost|127\.0\.0\.1)(:|$)/i.test(host);
      const proto = local ? "http" : (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
      return `${proto === "http" ? "http" : "https"}://${host}`;
    }
  } catch {
    // No request context.
  }
  return defaultOrigin();
};

export const defaultDeps = (): PaymentsDeps => ({
  repo: supabasePaymentsRepo(),
  stripe: getStripe(),
  now: () => new Date(),
  origin: "",
});
