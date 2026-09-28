import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.socialAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card, rendered once at build time. Same world as the site's "dusk" scenes: near-black sky,
 * a cool light from the upper left, faceted ice-blue ridgelines, the frame mark. Copy stays inside
 * an 80px safe margin so square and 1.91:1 crops both keep the name and subtitle.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at 12% 0%, rgba(126,166,245,0.30) 0%, rgba(126,166,245,0) 55%), linear-gradient(180deg, #0b0e13 0%, #101827 60%, #16233a 100%)",
          color: "#f3f6fa",
        }}
      >

        {/* faceted ridgelines: lit faces toward the light, shaded faces away */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <polygon points="360,630 640,300 760,410 900,250 1010,380 1120,290 1200,360 1200,630" fill="#1a2a45" />
          <polygon points="640,300 700,630 360,630" fill="#233858" />
          <polygon points="900,250 980,630 700,630 760,410" fill="#1d3050" />
          <polygon points="900,250 1010,380 980,630" fill="#132038" />
          <polygon points="1120,290 1200,360 1200,630 1060,630" fill="#132038" />
          <polygon points="520,630 860,430 1000,520 1120,450 1200,500 1200,630" fill="#0f1a2e" />
          <polygon points="860,430 900,630 520,630" fill="#16253f" />
          <polygon points="0,630 0,590 300,560 620,600 1200,570 1200,630" fill="#0b121f" />
          {/* rim light along the main ridge */}
          <polyline points="640,300 760,410 900,250 1010,380 1120,290" fill="none" stroke="#b3ccfb" strokeOpacity="0.55" strokeWidth="2" />
        </svg>

        {/* copy */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 80, width: 900 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 64,
                height: 64,
                border: "8px solid #f3f6fa",
                borderRadius: 20,
                boxSizing: "border-box",
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, background: "#7ea6f5", marginLeft: 1, marginTop: 1 }} />
            </div>
            <div style={{ fontSize: 26, letterSpacing: 5, whiteSpace: "nowrap", marginLeft: 24, color: "#b3ccfb", textTransform: "uppercase" }}>
              Web Design &amp; Development
            </div>
          </div>
          <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -5, lineHeight: 1, marginTop: 44 }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: 40, color: "#aab7c8", marginTop: 28, lineHeight: 1.25 }}>
            Thoughtfully designed websites.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
