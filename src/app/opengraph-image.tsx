import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

// OG image shown when a Seentrix link is shared on Slack / Twitter / LinkedIn.
// Rendered on-the-fly by Next's Image Response; no binary needs to ship in
// the repo. Kept dark to match the marketing site's look.

export const runtime = "edge";
export const alt = "Seentrix — CRA compliance platform for manufacturers";
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
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(1200px 630px at 85% -10%, rgba(234, 88, 12, 0.28), transparent 60%), linear-gradient(180deg, #05080b 0%, #0a1015 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Top row — wordmark + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Spark mark — geometric arc echoing the favicon. Drawn as plain
              SVG so no font or asset load is needed at edge runtime. */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#EA580C"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M18 34 Q28 14 38 34"
              stroke="#FACC15"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -1.2,
              display: "flex",
            }}
          >
            Seentrix
          </span>
        </div>

        {/* Headline block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#EA580C",
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2.4,
              maxWidth: 980,
            }}
          >
            Ship CRA-ready products without the paperwork.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            SBOM, vulnerability triage, incident reporting, and Declaration
            of Conformity — all in one place.
          </div>
        </div>

        {/* Footer row — url + chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 0.2,
            }}
          >
            seentrix.com
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(234, 88, 12, 0.15)",
              border: "1px solid rgba(234, 88, 12, 0.5)",
              color: "#FACC15",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Built for the EU Cyber Resilience Act
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
