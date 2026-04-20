import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// OG image rendered by next/og at build time. Shown when a Seentrix link
// is shared on Slack, LinkedIn, Twitter/X, WhatsApp, etc.
//
// We layer the brand over the custom 1920×1088 backdrop shipped at
// /public/images/og-background.png — the design asset the founder
// produced for the share card. Rendering with ImageResponse (instead of
// serving the PNG directly) lets us overlay type that stays crisp at
// 1200×630 and can be updated in code without re-exporting the raster.

export const alt = "Seentrix — CRA compliance platform for manufacturers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Read the backdrop off disk as a base64 data URL — /v1/og renders at
  // runtime and can't fetch from `/public` by URL, so inlining the bytes
  // is the portable way to reference a local raster asset.
  const bg = await readFile(
    join(process.cwd(), "public/images/og-background.png"),
  );
  const bgSrc = `data:image/png;base64,${bg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Full-bleed custom backdrop */}
        <img
          src={bgSrc}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Dark scrim so the wordmark reads cleanly no matter what the
            backdrop contains. Top half stays darker than the bottom so
            the brand sits above the horizon line. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,8,11,0.55) 0%, rgba(5,8,11,0.15) 55%, rgba(5,8,11,0.65) 100%)",
          }}
        />

        {/* Content column — eyebrow + tagline anchored to the bottom-left
            so they visually flow into the link-card title + domain that
            Slack/LinkedIn/Twitter render directly beneath the image. The
            top two-thirds of the frame is left clear for the backdrop. */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px 72px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 600,
                color: "#60A5FA",
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              CRA Compliance Platform
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: -1.5,
                lineHeight: 1.05,
                maxWidth: 1000,
                textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              }}
            >
              Ship CRA-ready products without the paperwork.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
