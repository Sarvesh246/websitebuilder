import type { Metadata, Viewport } from "next";
import { Figtree, Nunito } from "next/font/google";
import Script from "next/script";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/nav/SiteNav";
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
const themeScript = `try{var t=localStorage.getItem("nf-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${figtree.variable} ${nunito.variable}`}>
      <head>
        {/* Scroll reveals start hidden; without JS they must still be visible. */}
        <noscript>
          <style>{`[data-reveal]{--reveal:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
        </MotionProvider>
        <Grain />
      </body>
    </html>
  );
}
