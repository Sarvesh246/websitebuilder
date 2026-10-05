import type { Metadata, Viewport } from "next";
import { Figtree, Nunito } from "next/font/google";
import { ThemePreload } from "@/components/nav/ThemePreload";
import { Grain } from "@/components/visual/Ambient";
import { bingVerification, siteConfig } from "@/config/site";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });
// Labels only: not preloaded, so pages that never show one don't warn about an unused preload.
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.homeTitle, template: `%s | ${siteConfig.entityName}` },
  description: siteConfig.description,
  applicationName: siteConfig.entityName,
  // Google Search Console ownership token (public by design; keep it or Search Console unverifies the site).
  verification: {
    google: [
      "MEfX4usGD3i5kELjFilLbbr1DxTnZxjufyTmgBVa294",
      "wtAKpBDP3sDsz_6iDOvu-7BjwKhPnuXZ6aWiRKezeig",
    ],
    ...(bingVerification && { other: { "msvalidate.01": bingVerification } }),
  },
  // No canonical/openGraph.url here: each route sets its own via pageMetadata, so a route that
  // forgets to (like the 404) never inherits a wrong one.
  openGraph: { type: "website", siteName: siteConfig.entityName, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  // Permit large image previews and full-length snippets in Google results (the default is more
  // conservative). Pages that set their own robots (e.g. /start noindex, the 404) override this.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Google's favicon crawler needs UNCONDITIONAL icons (it ignores prefers-color-scheme variants) at a
  // multiple of 48px. Both are the door mark on a solid dark tile, which stays visible on white and dark
  // result pages; regenerate with `node scripts/logo.mjs`. The old light/dark tab icons were dropped:
  // search engines never picked either, which is why results showed a generic globe.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  interactiveWidget: "resizes-content", // keeps the sticky form bar above the virtual keyboard
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e11" },
  ],
};

/** Resolves the theme before first paint (no flash). Stored choice wins, then system preference. */
// Runs before paint: theme, plus two capability hints. `data-net="slow"` (Save-Data or a 3G-or-worse
// connection) swaps backdrops for lighter encodes; `data-power="low"` (2 cores or 2GB memory or less)
// stops looping motion and per-frame blur. Nothing is removed from the layout or the content.
const themeScript = `var d=document.documentElement;d.dataset.js="";try{var c=navigator.connection||{};if(c.saveData||/^(slow-2g|2g|3g)$/.test(c.effectiveType||""))d.dataset.net="slow";if((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2))d.dataset.power="low";var t=localStorage.getItem("nf-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-US" data-scroll-behavior="smooth" suppressHydrationWarning className={`${figtree.variable} ${nunito.variable}`}>
      <head>
        {/* Scroll reveals start hidden; without JS they must still be visible. */}
        <noscript>
          <style>{`[data-reveal]{--reveal:1!important;transform:none!important}`}</style>
        </noscript>
        {/* A plain inline script runs while the head is parsed, before any body content is styled
            (next/script's beforeInteractive only queues it for Next's runtime, which is after first paint). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <Grain />
        <ThemePreload />
      </body>
    </html>
  );
}
