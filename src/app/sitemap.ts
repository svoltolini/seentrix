import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";

// Pages with a per-locale counterpart. Each entry becomes one sitemap row
// per locale so Google indexes both en and de versions with the correct
// hreflang alternates.
const STATIC_PATHS = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/legal/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/legal/dpa", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/legal/cookies", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const entry of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${entry.path}`,
        lastModified: now,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE_URL}/${l}${entry.path}`]),
          ),
        },
      });
    }

    // Blog posts — loaded fresh from the filesystem so publishing a new
    // post picks up in the next sitemap regeneration.
    for (const post of getAllPosts(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        lastModified: post.date ? new Date(post.date) : now,
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${SITE_URL}/${l}/blog/${post.slug}`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
