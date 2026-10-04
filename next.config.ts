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
  // (experimental.inlineCss was tried for the render-blocking CSS: it has no effect on prerendered pages, only dynamic ones.)
  experimental: { serverActions: { bodySizeLimit: "26mb" }, staleTimes: { dynamic: 30 } },
  poweredByHeader: false,
  images: {
    // AVIF first (smaller than WebP where supported), WebP fallback.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    // Optimized image URLs include the source path and size, so a year is safe as long as replaced art gets a new filename.
    minimumCacheTTL: 31_536_000,
  },
  async headers() {
    // public/ files are served with max-age=0 by default. These names are not content-hashed, so the rule is:
    // when art is replaced, give the new file a new name (or re-encode under a new name), never overwrite in place.
    const assetCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: assetCache },
      { source: "/brand/:path*", headers: assetCache },
    ];
  },
};

export default nextConfig;
