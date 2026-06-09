import "server-only";

/**
 * Read the top unresolved issues from the Sentry API for the in-console error
 * feed. Sentry already captures everything (see sentry.*.config.ts); this just
 * surfaces the worst offenders so staff can triage without leaving the console.
 *
 * Capture uses the DSN (already set). The *read* API needs a separate auth
 * token plus the org/project slugs, which the DSN doesn't carry — so these are
 * their own env vars:
 *
 *   SENTRY_AUTH_TOKEN     — an internal-integration / user auth token (read scope)
 *   SENTRY_ADMIN_ORG      — the Sentry organisation slug
 *   SENTRY_ADMIN_PROJECT  — the Sentry project slug
 *   SENTRY_API_BASE       — optional, defaults to https://sentry.io
 *
 * If any are missing we return `configured: false` and the UI shows a short
 * setup hint rather than an error.
 */

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string | null;
  level: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
}

export type SentryFeed =
  | { configured: false }
  | { configured: true; error: string; issues: [] }
  | { configured: true; error: null; issues: SentryIssue[] };

interface RawIssue {
  id: string;
  shortId?: string;
  title?: string;
  culprit?: string | null;
  level?: string;
  count?: string | number;
  userCount?: number;
  firstSeen?: string;
  lastSeen?: string;
  permalink?: string;
}

export async function fetchTopIssues(limit = 25): Promise<SentryFeed> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ADMIN_ORG;
  const project = process.env.SENTRY_ADMIN_PROJECT;
  const base = process.env.SENTRY_API_BASE || "https://sentry.io";

  if (!token || !org || !project) return { configured: false };

  const url =
    `${base}/api/0/projects/${org}/${project}/issues/` +
    `?query=${encodeURIComponent("is:unresolved")}&statsPeriod=14d&limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        configured: true,
        error: `Sentry API ${res.status}`,
        issues: [],
      };
    }
    const raw = (await res.json()) as RawIssue[];
    const issues: SentryIssue[] = raw.map((i) => ({
      id: i.id,
      shortId: i.shortId ?? i.id,
      title: i.title ?? "(untitled)",
      culprit: i.culprit ?? null,
      level: i.level ?? "error",
      count: Number(i.count ?? 0),
      userCount: i.userCount ?? 0,
      firstSeen: i.firstSeen ?? "",
      lastSeen: i.lastSeen ?? "",
      permalink: i.permalink ?? "",
    }));
    return { configured: true, error: null, issues };
  } catch (e) {
    console.error("[admin] fetchTopIssues failed:", e);
    return { configured: true, error: "Request failed", issues: [] };
  }
}
