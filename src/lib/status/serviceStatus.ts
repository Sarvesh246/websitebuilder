import "server-only";

/**
 * Upstream health for the services the studio depends on, shown to admins only.
 * Source: API Status Check's public JSON, which relays each vendor's own status page.
 *
 * Safety rules (keep them if this changes):
 * - Host and slugs are constants: no user input ever reaches the URL, so no SSRF.
 * - No credentials are sent, redirects are refused, and the call is time boxed.
 * - The reply is validated and reduced to our own union. Upstream text and URLs are never rendered.
 * - Results are cached for 5 minutes, so four vendors cost 4 calls per window (limit is 60/hour).
 * - Any failure becomes "unknown"; it can never break or delay the dashboard.
 */
export type ServiceState = "operational" | "degraded" | "down" | "unknown";

export type ServiceHealth = { slug: string; name: string; state: ServiceState; statusPage: string };

const ENDPOINT = "https://apistatuscheck.com/api/status";

export const WATCHED_SERVICES = [
  { slug: "stripe", name: "Stripe payments", statusPage: "https://status.stripe.com" },
  { slug: "supabase", name: "Supabase database", statusPage: "https://status.supabase.com" },
  { slug: "vercel", name: "Vercel hosting", statusPage: "https://www.vercel-status.com" },
  { slug: "resend", name: "Resend email", statusPage: "https://resend-status.com" },
] as const;

/** Maps the upstream status word to our states. Anything unfamiliar is "unknown", never "operational". */
export const toState = (value: unknown): ServiceState => {
  if (typeof value !== "string") return "unknown";
  switch (value.toLowerCase()) {
    case "up":
    case "operational":
      return "operational";
    case "degraded":
    case "partial":
    case "minor":
      return "degraded";
    case "down":
    case "major":
    case "outage":
      return "down";
    default:
      return "unknown";
  }
};

export const readState = (body: unknown): ServiceState => {
  if (typeof body !== "object" || body === null) return "unknown";
  const api = (body as { api?: unknown }).api;
  if (typeof api !== "object" || api === null) return "unknown";
  return toState((api as { status?: unknown }).status);
};

const fetchOne = async (slug: string): Promise<ServiceState> => {
  try {
    const res = await fetch(`${ENDPOINT}?api=${encodeURIComponent(slug)}`, {
      redirect: "error",
      credentials: "omit",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return "unknown";
    const text = await res.text();
    if (text.length > 20_000) return "unknown";
    return readState(JSON.parse(text));
  } catch {
    return "unknown";
  }
};

export const getServiceHealth = async (): Promise<ServiceHealth[]> => {
  const states = await Promise.all(WATCHED_SERVICES.map((s) => fetchOne(s.slug)));
  return WATCHED_SERVICES.map((s, i) => ({ ...s, state: states[i] }));
};
