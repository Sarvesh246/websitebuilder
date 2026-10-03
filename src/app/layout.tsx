import type { Metadata, Viewport } from "next";
import { Figtree, Nunito } from "next/font/google";
import { Grain } from "@/components/visual/Ambient";
import { siteConfig } from "@/config/site";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap" });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // No canonical/openGraph.url here: each route sets its own via pageMetadata, so a route that
  // forgets to (like the 404) never inherits a wrong one.
  openGraph: { type: "website", siteName: siteConfig.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  // Tab icon follows the browser's colour scheme (the door mark that reads on that tab colour).
  // public/favicon.ico (dark mark) only serves clients that request it directly.
  icons: {
    icon: [
      { url: "/brand/icon-light.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/icon-dark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${figtree.variable} ${nunito.variable}`}>
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
      </body>
    </html>
  );
}
