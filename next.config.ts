import type { NextConfig } from "next";

/**
 * Conservative security headers for every route. No CSP yet: the theme script, JSON-LD and Next's
 * inline bootstrap would need nonces; frame-ancestors alone covers clickjacking.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // staleTimes: a portal tab visited in the last 30s reopens from the client cache (server actions still refresh it).
  experimental: { serverActions: { bodySizeLimit: "26mb" }, staleTimes: { dynamic: 30 } },
  poweredByHeader: false,
  async headers() {
    // public/ files are served with max-age=0 by default, so every visit revalidated each backdrop and logo.
    // The names are not hashed: cache for a day, then refresh in the background for up to a week.
    const assetCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: assetCache },
      { source: "/brand/:path*", headers: assetCache },
    ];
  },
};

export default nextConfig;
