/**
 * Tells IndexNow search engines (Bing, Copilot, Yandex, Seznam, Naver) that the site's pages changed,
 * so they re-crawl quickly instead of waiting. Run after a deploy that changes content:
 *
 *   npm run indexnow                  (uses NEXT_PUBLIC_SITE_URL)
 *   npm run indexnow -- https://example.com
 *
 * The key is public by design: IndexNow verifies ownership by fetching /<key>.txt from the same host
 * (public/473a1603811a086f96e801dc6e7fe00a.txt). Only URLs listed in the live sitemap are submitted.
 */
const KEY = "473a1603811a086f96e801dc6e7fe00a";
const input = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
const site = /^https?:\/\//i.test(input) ? input : input && `https://${input}`;
if (!site || /localhost|127\.0\.0\.1/.test(site)) {
  console.error("Pass the live site URL, e.g. npm run indexnow -- https://northframebuilds.vercel.app");
  process.exit(2);
}
const host = new URL(site).host;

const sitemap = await fetch(`${site}/sitemap.xml`, { signal: AbortSignal.timeout(15_000) });
if (!sitemap.ok) {
  console.error(`Could not read ${site}/sitemap.xml (HTTP ${sitemap.status}).`);
  process.exit(1);
}
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => new URL(u).host === host);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${site}/${KEY}.txt`, urlList }),
  signal: AbortSignal.timeout(15_000),
});
// 200 = accepted, 202 = accepted and the key is still being verified. 403 = key file not reachable yet (deploy first).
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs on ${host}.`);
process.exit(res.ok ? 0 : 1);
