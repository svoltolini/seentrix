// Canonical site URL. Falls back to localhost in dev and the production
// apex otherwise, so metadata, sitemap, and OG images all resolve correctly
// without needing separate env vars for each of them.
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production"
    ? "https://seentrix.com"
    : "http://localhost:3000");

export const SITE_NAME = "Seentrix";
export const SITE_TAGLINE = "CRA Compliance Platform";
// Longer form used as the OG/Twitter title so it lands in the 50–60 char
// range social platforms optimise for — kept distinct from SITE_TAGLINE
// (which is short because it renders in browser tabs).
export const SITE_OG_TITLE =
  "Seentrix — CRA Compliance Platform for EU manufacturers";
// 110–160 char range preferred by most OG validators. Leads with the
// regulation (discoverable term), then the concrete deliverables.
export const SITE_DESCRIPTION =
  "EU Cyber Resilience Act compliance for manufacturers — SBOMs, vulnerability tracking, incident reporting, and CRA-ready Declarations of Conformity.";
