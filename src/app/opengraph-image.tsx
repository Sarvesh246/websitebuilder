import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Static social card generated at build time from site config. Swap for real artwork later. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: "linear-gradient(160deg, #d9e3ee 0%, #edf1f6 55%, #c3d0e1 100%)",
          color: "#0e1218",
        }}
      >
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 40, color: "#4f5a68", marginTop: 12 }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
