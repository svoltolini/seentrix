// OSV.dev + CISA KEV vulnerability enrichment helpers.
//
// Extracted from the SBOM scan server action so the network-touching and
// score-derivation logic can be unit/integration tested in isolation
// (the action itself is a `"use server"` module wired to Supabase and is
// not importable from a test environment). Behavior is unchanged.

export type Severity = "critical" | "high" | "medium" | "low";

export interface OsvVuln {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  severity?: { type: string; score: string }[];
  database_specific?: Record<string, unknown>;
  published?: string;
  references?: { type: string; url: string }[];
}

export interface OsvBatchResult {
  results: { vulns?: OsvVuln[] }[];
}

export const OSV_VULN_URL = "https://api.osv.dev/v1/vulns";
export const OSV_QUERYBATCH_URL = "https://api.osv.dev/v1/querybatch";
export const CISA_KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known-exploited-vulnerabilities.json";

// ---------------------------------------------------------------------------
// Severity bucketing
// ---------------------------------------------------------------------------

export function cvssToSeverity(score: number | null): Severity {
  if (score === null) return "medium";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Enrichment — OSV's /v1/querybatch returns only { id, modified } per vuln,
// so we follow up with /v1/vulns/{id} per unique id to recover severity and
// description. Failures fall back to the sparse stub rather than dropping the
// vuln.
// ---------------------------------------------------------------------------

export async function enrichVulns(
  vulns: OsvVuln[]
): Promise<Map<string, OsvVuln>> {
  const enriched = new Map<string, OsvVuln>();
  const uniqueIds = Array.from(new Set(vulns.map((v) => v.id)));

  const PARALLEL = 10;
  for (let i = 0; i < uniqueIds.length; i += PARALLEL) {
    const batch = uniqueIds.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        const res = await fetch(`${OSV_VULN_URL}/${id}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        return (await res.json()) as OsvVuln;
      })
    );
    results.forEach((r, idx) => {
      if (r.status === "fulfilled" && r.value) {
        enriched.set(batch[idx], r.value);
      }
    });
  }

  // Fall back to the sparse stub when /v1/vulns/{id} didn't return.
  for (const v of vulns) {
    if (!enriched.has(v.id)) enriched.set(v.id, v);
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// CVSS score extraction (best-effort across OSV's several encodings)
// ---------------------------------------------------------------------------

export function extractCvssScore(vuln: OsvVuln): number | null {
  // 1. database_specific.cvss.score (GitHub, npm, etc.)
  const dbSpecific = vuln.database_specific;
  if (dbSpecific) {
    const cvss = dbSpecific.cvss as Record<string, unknown> | undefined;
    if (cvss?.score && typeof cvss.score === "number") return cvss.score;
  }

  // 2. severity array for CVSS_V3 / CVSS_V4 vector strings
  if (vuln.severity) {
    for (const s of vuln.severity) {
      if (s.type === "CVSS_V3" || s.type === "CVSS_V4") {
        const match = s.score.match(
          /\/(?:S:[UC]\/)?C:([HLN])\/I:([HLN])\/A:([HLN])/
        );
        if (match) {
          const weights: Record<string, number> = { H: 3, L: 1, N: 0 };
          const sum =
            (weights[match[1]] ?? 0) +
            (weights[match[2]] ?? 0) +
            (weights[match[3]] ?? 0);
          if (sum >= 8) return 9.0;
          if (sum >= 5) return 7.5;
          if (sum >= 2) return 5.0;
          return 3.0;
        }
      }
    }
  }

  // 3. database_specific.severity string
  if (dbSpecific) {
    const sevStr = (dbSpecific.severity as string | undefined)?.toUpperCase?.();
    if (sevStr === "CRITICAL") return 9.5;
    if (sevStr === "HIGH") return 7.5;
    if (sevStr === "MODERATE" || sevStr === "MEDIUM") return 5.0;
    if (sevStr === "LOW") return 2.5;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Canonical vuln id — prefer the CVE alias, else the OSV id (e.g. GHSA-...)
// ---------------------------------------------------------------------------

export function extractVulnId(vuln: OsvVuln): string {
  if (vuln.aliases) {
    const cve = vuln.aliases.find((a) => a.startsWith("CVE-"));
    if (cve) return cve;
  }
  return vuln.id;
}

// ---------------------------------------------------------------------------
// CISA KEV catalog — best-effort fetch returning the set of known-exploited
// CVE ids. Network/parse failures yield an empty set (scan continues).
// ---------------------------------------------------------------------------

export async function fetchKevCveIds(): Promise<Set<string>> {
  try {
    const res = await fetch(CISA_KEV_URL);
    if (!res.ok) return new Set();
    const data = (await res.json()) as {
      vulnerabilities: { cveID: string }[];
    };
    return new Set(data.vulnerabilities.map((v) => v.cveID));
  } catch {
    return new Set();
  }
}
