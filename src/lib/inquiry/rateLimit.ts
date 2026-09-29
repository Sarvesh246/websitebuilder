/**
 * Small in-memory sliding-window limiter. Best effort: on serverless each instance keeps its own
 * counts, so this slows casual abuse but is not a hard guarantee. For stricter limits put a
 * platform firewall rule (or a shared store) in front of /api/inquiry.
 */
const hits = new Map<string, number[]>();
let calls = 0;

export const rateLimit = (key: string, max = 4, windowMs = 10 * 60_000) => {
  const now = Date.now();
  // Drop expired keys every 50 calls (cheap, keeps memory proportional to recent visitors).
  if (++calls % 50 === 0) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
};
