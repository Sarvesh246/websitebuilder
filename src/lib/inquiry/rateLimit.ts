/**
 * Small in-memory sliding-window limiter. Best effort: on serverless each instance keeps its own
 * counts, so this slows casual abuse but is not a hard guarantee. For stricter limits put a
 * platform firewall rule (or a shared store) in front of /api/inquiry.
 */
const hits = new Map<string, number[]>();

export const rateLimit = (key: string, max = 4, windowMs = 10 * 60_000) => {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
};
