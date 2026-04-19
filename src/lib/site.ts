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
export const SITE_DESCRIPTION =
  "Achieve EU Cyber Resilience Act compliance for your products with Seentrix — SBOM, vulnerability management, incident reporting, and DoC generation in one place.";
