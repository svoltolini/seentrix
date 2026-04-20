import { ImageResponse } from "next/og";

// OG image rendered by next/og at build time. Shown when a Seentrix link
// is shared on Slack, LinkedIn, X, WhatsApp, iMessage, etc.
//
// The previous iteration layered text over a 1.6 MB raster gradient. That
// pushed the final PNG past the 600 KB WhatsApp ceiling (~835 KB observed).
// We now synthesise the gradient in-place with four radial blobs on a
// navy base — the render stays on-brand (teal → pink → orange) but the
// bytes stay well under 200 KB because satori only has to rasterise the
// composed gradient, not re-encode a source raster.
//
// Layout: content anchored to the bottom-left so the eyebrow and tagline
// line up visually with the link-card title + domain the OG chrome
// renders directly beneath the image. Left padding is 48 px (matches
// typical card chrome padding on Slack / LinkedIn / WhatsApp so the
// column feels continuous rather than stepped).

export const alt =
  "Seentrix — CRA Compliance Platform for EU manufacturers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "48px",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "white",
          backgroundColor: "#0B0B1D",
          backgroundImage: [
            // Five coloured blobs painted as radial gradients with
            // no shape keyword so satori falls back to its default
            // ellipse — the supported syntax across @vercel/og versions.
            "radial-gradient(at 12% 18%, #5EEAD4 0%, rgba(94,234,212,0) 55%)",
            "radial-gradient(at 55% 12%, #EC4899 0%, rgba(236,72,153,0) 55%)",
            "radial-gradient(at 90% 20%, #F97316 0%, rgba(249,115,22,0) 55%)",
            "radial-gradient(at 98% 45%, #EF4444 0%, rgba(239,68,68,0) 55%)",
            "radial-gradient(at 18% 65%, #1E40AF 0%, rgba(30,64,175,0) 55%)",
            // Bottom scrim for text legibility.
            "linear-gradient(180deg, rgba(11,11,29,0) 40%, rgba(11,11,29,0.55) 85%, rgba(11,11,29,0.85) 100%)",
          ].join(", "),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Eyebrow — mirrors the card title text so the image and
              card read as one continuous column. */}
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#93C5FD",
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            CRA Compliance Platform
          </div>

          {/* Hero line. */}
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              maxWidth: 1040,
              textShadow: "0 2px 20px rgba(0,0,0,0.55)",
            }}
          >
            Ship CRA-ready products without the paperwork.
          </div>

          {/* Call-to-action — small but visible, echoes the domain that
              appears in the link card below so the reader has a clear
              next step rather than only a brand statement. */}
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 24,
              fontWeight: 500,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: 0.2,
            }}
          >
            Start free at seentrix.com →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
