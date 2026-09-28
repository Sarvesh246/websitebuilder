import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon: the Northframe mark (frame + accent square) on the light brand ground. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edf1f6" }}>
        <div
          style={{
            display: "flex",
            margin: 34,
            width: 112,
            height: 112,
            border: "16px solid #0e1218",
            borderRadius: 38,
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "#2f62c8", marginLeft: 2, marginTop: 2 }} />
        </div>
      </div>
    ),
    size,
  );
}
