/**
 * AI-crawler and llms.txt readiness of a LIVE public domain, via the free TidyTools endpoint
 * (no key, about 10 requests/min per IP, results cached for an hour upstream).
 *
 *   npm run check:seo                 (uses NEXT_PUBLIC_SITE_URL, else https://northframebuilds.vercel.app)
 *   npm run check:seo -- example.com
 *
 * Dev tool only. The tool fetches the public site itself, so only a public hostname is sent.
 * Citability (citability.dev/scan) is a manual web scan: its JSON API currently redirects to an
 * unrelated host, so it is deliberately not called from code.
 */
const input = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://northframebuilds.vercel.app").trim();
const host = input.replace(/^https?:\/\//i, "").replace(/[/?#].*$/, "").toLowerCase();

// A public hostname only: no IPs, no localhost, no ports, no credentials.
const isPublicHost = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(host) && !/^\d+(\.\d+)*$/.test(host);
if (!isPublicHost) {
  console.error(`"${host}" is not a public hostname. Deploy first, then pass the live domain.`);
  process.exit(2);
}

const res = await fetch(`https://tools.yukai.uk/ai-crawlers/${host}`, {
  headers: { accept: "application/json" },
  redirect: "error",
  signal: AbortSignal.timeout(20_000),
}).catch((e) => ({ ok: false, status: e?.name ?? "network error" }));

const d = typeof res.json === "function" ? await res.json().catch(() => null) : null;
if (!res.ok || !d || d.success === false) {
  // Only our own short summary is printed, never raw upstream markup or links.
  const reason = typeof d?.error?.message === "string" ? d.error.message.slice(0, 160) : `HTTP ${res.status}`;
  console.error(`Could not check ${host}: ${reason}\n(Rate limit is about 10/min. A domain that is not deployed yet cannot be checked.)`);
  process.exitCode = 1; // exitCode, not exit(): exit() right after fetch trips a libuv assertion on Windows
} else {
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "none");
  console.log(`${host}\n  ${d.verdict}`);
  console.log(`  AI search score ${d.aiSearchScore}/100, AI access score ${d.aiAccessScore}/100`);
  console.log(`  robots.txt: ${d.robotsTxt?.state} | llms.txt: ${d.llmsTxt?.found ? "found" : "MISSING"} | llms-full.txt: ${d.llmsFullTxt?.found ? "found" : "missing (optional)"}`);
  console.log(`  blocked: ${list(d.blockedBots)}\n  partly blocked: ${list(d.partialBots)}`);
  process.exitCode = d.llmsTxt?.found && (d.blockedBots?.length ?? 0) === 0 ? 0 : 1;
}
