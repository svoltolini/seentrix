import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep crawlers out of authenticated app, auth flows, api routes,
        // and per-org public pages (those are linked from security.txt,
        // not general web indexes).
        disallow: [
          "/api/",
          "/en/app/",
          "/de/app/",
          "/en/auth/",
          "/de/auth/",
          "/en/security/",
          "/de/security/",
          // Sentry tunnel route — proxies client error events to
          // de.sentry.io. No reason for crawlers to index or probe it.
          "/monitoring/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
