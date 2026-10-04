import Image from "next/image";
import { siteConfig } from "@/config/site";

/**
 * The Northframe lockup: door mark + wordmark. One component and one set of styles (`.brand` in
 * nav.css) for the site header, footer and portal, so the brand reads identically everywhere.
 * Both marks render; CSS (.pic--light / .pic--dark in pane.css) shows the active theme's one, and
 * lazy-loading means the hidden one is never downloaded. The two files are normalised to the same
 * frame size (scripts/logo.mjs), so switching theme never changes the mark's size.
 */
export const BrandLogo = () => (
  <span className="brand">
    <span className="brand__mark" aria-hidden>
      {/* 48px is the displayed size (.brand__mark): next/image then serves 48w/96w, not 96w/256w. */}
      <Image src="/brand/mark-light.webp" alt="" width={48} height={48} className="pic--light" />
      <Image src="/brand/mark-dark.webp" alt="" width={48} height={48} className="pic--dark" />
    </span>
    <span className="brand__word">{siteConfig.name}</span>
  </span>
);
