import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Private or non-content routes. Every group repeats them: a crawler obeys only its most specific group. */
const PRIVATE = ["/api/", "/design-system", "/portal", "/login", "/signup", "/auth/"];

/**
 * Search and AI-search crawlers named explicitly, so the intent survives if the `*` group ever gets
 * stricter. OAI-SearchBot (ChatGPT search), Claude-SearchBot / Claude-User (Claude search and
 * user-requested fetches) and PerplexityBot control whether the site can be cited by those products.
 * Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended) are allowed too: the goal is
 * maximum visibility. To opt out of training only, move them to a `disallow: "/"` group.
 */
const SEARCH_AND_AI = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  // Vercel preview deployments must never be indexed. Anything else (production, self-hosted) is crawlable.
  if (process.env.VERCEL_ENV === "preview") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: SEARCH_AND_AI, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    // No `host`: it is a legacy Yandex-only directive that Bing's validator flags as an error.
  };
}
