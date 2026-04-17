"use server";

import { createClient } from "@/lib/supabase/server";
import { parseSbom, type SbomFormat } from "@/lib/sbom/parser";
import { logActivity } from "@/lib/activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SbomRecord {
  id: string;
  product_id: string;
  sbom_format: SbomFormat;
  file_name: string | null;
  storage_path: string | null;
  total_components: number;
  components_with_vulnerabilities: number;
  last_scanned_at: string | null;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  kev_count: number;
  is_active: boolean;
  created_at: string;
}

export interface SbomComponentRecord {
  id: string;
  component_name: string;
  component_version: string | null;
  license: string | null;
  supplier: string | null;
  purl: string | null;
  vulnerability_count: number;
  critical_vulnerability_count: number;
  high_vulnerability_count: number;
}

export interface VulnerabilityRecord {
  id: string;
  sbom_component_id: string;
  cve_id: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low";
  cvss_score: number | null;
  cisa_kev: boolean;
  discovery_date: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, orgId: null };

  const orgId = user.app_metadata?.org_id as string | undefined;
  return { supabase, user, orgId: orgId ?? null };
}

type Severity = "critical" | "high" | "medium" | "low";

function cvssToSeverity(score: number | null): Severity {
  if (score === null) return "medium";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Upload SBOM
// ---------------------------------------------------------------------------

export async function uploadSbom(
  productId: string,
  formData: FormData
): Promise<{ sbomId?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();

  if (!user || !orgId) return { error: "notAuthenticated" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "noFile" };

  if (file.size > 50 * 1024 * 1024) return { error: "tooLarge" };

  const content = await file.text();
  const result = parseSbom(content);
  if (!result) return { error: "invalidFormat" };

  const storagePath = `${orgId}/${productId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("sboms")
    .upload(storagePath, file, {
      contentType: file.type || "application/json",
      upsert: false,
    });

  if (uploadError) return { error: "uploadFailed" };

  const { data: sbom, error: sbomError } = await supabase
    .from("sboms")
    .insert({
      product_id: productId,
      sbom_format: result.format,
      file_name: file.name,
      storage_path: storagePath,
      total_components: result.components.length,
    })
    .select("id")
    .single();

  if (sbomError || !sbom) {
    await supabase.storage.from("sboms").remove([storagePath]);
    return { error: "generic" };
  }

  const CHUNK_SIZE = 500;
  for (let i = 0; i < result.components.length; i += CHUNK_SIZE) {
    const chunk = result.components.slice(i, i + CHUNK_SIZE).map((c) => ({
      sbom_id: sbom.id,
      component_name: c.name,
      component_version: c.version,
      license: c.license,
      supplier: c.supplier,
      purl: c.purl,
    }));

    const { error: compError } = await supabase
      .from("sbom_components")
      .insert(chunk);

    if (compError) {
      await supabase.from("sboms").delete().eq("id", sbom.id);
      await supabase.storage.from("sboms").remove([storagePath]);
      return { error: "parseFailed" };
    }
  }

  await logActivity({ action: "sbom.uploaded", targetType: "sbom", targetId: sbom.id, targetName: file.name, metadata: { productId, format: result.format, components: result.components.length } });

  return { sbomId: sbom.id };
}

// ---------------------------------------------------------------------------
// List SBOMs for a product
// ---------------------------------------------------------------------------

const SBOM_SELECT =
  "id, product_id, sbom_format, file_name, storage_path, total_components, components_with_vulnerabilities, last_scanned_at, vulnerability_count, critical_count, high_count, medium_count, low_count, kev_count, is_active, created_at";

export async function listSboms(
  productId: string
): Promise<{ sboms: SbomRecord[]; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { sboms: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("sboms")
    .select(SBOM_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) return { sboms: [], error: "generic" };

  return { sboms: (data ?? []) as SbomRecord[] };
}

// ---------------------------------------------------------------------------
// Get components for an SBOM (with vuln counts)
// ---------------------------------------------------------------------------

export async function getSbomComponents(
  sbomId: string
): Promise<{ components: SbomComponentRecord[]; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { components: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("sbom_components")
    .select(
      "id, component_name, component_version, license, supplier, purl, vulnerability_count, critical_vulnerability_count, high_vulnerability_count"
    )
    .eq("sbom_id", sbomId)
    .order("vulnerability_count", { ascending: false });

  if (error) return { components: [], error: "generic" };

  return { components: (data ?? []) as SbomComponentRecord[] };
}

// ---------------------------------------------------------------------------
// Get vulnerabilities for a component
// ---------------------------------------------------------------------------

export async function getComponentVulnerabilities(
  componentId: string
): Promise<{ vulnerabilities: VulnerabilityRecord[]; error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { vulnerabilities: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("vulnerabilities")
    .select(
      "id, sbom_component_id, cve_id, description, severity, cvss_score, cisa_kev, discovery_date"
    )
    .eq("sbom_component_id", componentId)
    .order("cvss_score", { ascending: false, nullsFirst: false });

  if (error) return { vulnerabilities: [], error: "generic" };

  return { vulnerabilities: (data ?? []) as VulnerabilityRecord[] };
}

// ---------------------------------------------------------------------------
// Delete SBOM
// ---------------------------------------------------------------------------

export async function deleteSbom(
  sbomId: string
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const { data: sbom } = await supabase
    .from("sboms")
    .select("storage_path")
    .eq("id", sbomId)
    .single();

  const { error } = await supabase
    .from("sboms")
    .delete()
    .eq("id", sbomId);

  if (error) return { error: "generic" };

  if (sbom?.storage_path) {
    await supabase.storage.from("sboms").remove([sbom.storage_path]);
  }

  await logActivity({ action: "sbom.deleted", targetType: "sbom", targetId: sbomId });

  return {};
}

// ---------------------------------------------------------------------------
// Toggle SBOM active / archived
// ---------------------------------------------------------------------------

export async function toggleSbomActive(
  sbomId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("sboms")
    .update({ is_active: isActive })
    .eq("id", sbomId);

  if (error) return { error: "generic" };

  await logActivity({
    action: isActive ? "sbom.activated" : "sbom.archived",
    targetType: "sbom",
    targetId: sbomId,
  });

  return {};
}

// ---------------------------------------------------------------------------
// Scan vulnerabilities via OSV.dev + CISA KEV
// ---------------------------------------------------------------------------

interface OsvVuln {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  severity?: { type: string; score: string }[];
  database_specific?: Record<string, unknown>;
  published?: string;
  references?: { type: string; url: string }[];
}

interface OsvBatchResult {
  results: { vulns?: OsvVuln[] }[];
}

// Fetch full vulnerability details for vulns missing summaries (up to limit)
async function enrichVulnSummaries(
  vulns: OsvVuln[],
  limit = 50
): Promise<Map<string, { summary: string; references?: { type: string; url: string }[] }>> {
  const missing = vulns.filter((v) => !v.summary).slice(0, limit);
  const enriched = new Map<string, { summary: string; references?: { type: string; url: string }[] }>();

  // Fetch in parallel batches of 10
  const PARALLEL = 10;
  for (let i = 0; i < missing.length; i += PARALLEL) {
    const batch = missing.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      batch.map(async (v) => {
        const res = await fetch(`https://api.osv.dev/v1/vulns/${v.id}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as OsvVuln;
        const text = data.summary || data.details?.slice(0, 2000);
        if (text) {
          enriched.set(v.id, { summary: text, references: data.references });
        }
        return data;
      })
    );
  }

  return enriched;
}

function extractCvssScore(vuln: OsvVuln): number | null {
  // 1. Check database_specific.cvss.score (GitHub, npm, etc.)
  const dbSpecific = vuln.database_specific;
  if (dbSpecific) {
    const cvss = dbSpecific.cvss as Record<string, unknown> | undefined;
    if (cvss?.score && typeof cvss.score === "number") return cvss.score;
  }

  // 2. Check severity array for CVSS_V3 or CVSS_V4
  if (vuln.severity) {
    for (const s of vuln.severity) {
      if (s.type === "CVSS_V3" || s.type === "CVSS_V4") {
        // Try to extract base score from vector string like "CVSS:3.1/AV:N/AC:L/..."
        const match = s.score.match(/\/(?:S:[UC]\/)?C:([HLN])\/I:([HLN])\/A:([HLN])/);
        if (match) {
          // Rough heuristic from base CIA metrics
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

  // 3. Check database_specific.severity string
  if (dbSpecific) {
    const sevStr = (dbSpecific.severity as string | undefined)?.toUpperCase?.();
    if (sevStr === "CRITICAL") return 9.5;
    if (sevStr === "HIGH") return 7.5;
    if (sevStr === "MODERATE" || sevStr === "MEDIUM") return 5.0;
    if (sevStr === "LOW") return 2.5;
  }

  return null;
}

function extractVulnId(vuln: OsvVuln): string {
  // Prefer CVE ID, then GHSA, then OSV id
  if (vuln.aliases) {
    const cve = vuln.aliases.find((a) => a.startsWith("CVE-"));
    if (cve) return cve;
  }
  return vuln.id;
}

// ---------------------------------------------------------------------------
// Update vulnerability status (for MTTR tracking)
// ---------------------------------------------------------------------------

export async function updateVulnerabilityStatus(
  vulnId: string,
  status: "open" | "in_progress" | "resolved" | "accepted"
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const updateData: Record<string, unknown> = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await supabase
    .from("vulnerabilities")
    .update(updateData)
    .eq("id", vulnId);

  if (error) return { error: "generic" };

  await logActivity({
    action: `vulnerability.${status}`,
    targetType: "vulnerability",
    targetId: vulnId,
  });

  return {};
}

// ---------------------------------------------------------------------------
// Scan vulnerabilities via OSV.dev + CISA KEV
// ---------------------------------------------------------------------------

export async function scanVulnerabilities(
  sbomId: string
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  // 1. Load all components with purl for this SBOM
  const { data: allComponents, error: compError } = await supabase
    .from("sbom_components")
    .select("id, purl")
    .eq("sbom_id", sbomId);

  if (compError) return { error: "generic" };
  if (!allComponents || allComponents.length === 0) return { error: "noComponents" };

  const componentsWithPurl = allComponents.filter(
    (c) => c.purl && c.purl.length > 0
  );

  // 2. Clear existing vulnerabilities for this SBOM's components
  const componentIds = allComponents.map((c) => c.id);
  await supabase
    .from("vulnerabilities")
    .delete()
    .in("sbom_component_id", componentIds);

  // Reset component vuln counts
  await supabase
    .from("sbom_components")
    .update({
      vulnerability_count: 0,
      critical_vulnerability_count: 0,
      high_vulnerability_count: 0,
    })
    .eq("sbom_id", sbomId);

  // 3. Fetch CISA KEV catalog
  let kevCveIds: Set<string> = new Set();
  try {
    const kevResponse = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known-exploited-vulnerabilities.json",
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (kevResponse.ok) {
      const kevData = (await kevResponse.json()) as {
        vulnerabilities: { cveID: string }[];
      };
      kevCveIds = new Set(kevData.vulnerabilities.map((v) => v.cveID));
    }
  } catch {
    // KEV fetch is best-effort — continue without it
  }

  // 4. Query OSV.dev in batches of 1000
  const BATCH_SIZE = 1000;
  let totalVulns = 0;
  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;
  let totalKev = 0;
  let componentsWithVulns = 0;

  for (let i = 0; i < componentsWithPurl.length; i += BATCH_SIZE) {
    const batch = componentsWithPurl.slice(i, i + BATCH_SIZE);
    const queries = batch.map((c) => ({
      package: { purl: c.purl },
    }));

    let batchResults: OsvBatchResult;
    try {
      const response = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
      });

      if (!response.ok) continue;
      batchResults = (await response.json()) as OsvBatchResult;
    } catch {
      continue;
    }

    // 5. Process results for each component
    for (let j = 0; j < batch.length; j++) {
      const component = batch[j];
      const vulns = batchResults.results[j]?.vulns ?? [];

      if (vulns.length === 0) continue;

      componentsWithVulns++;

      // Enrich vulns missing summaries by fetching full details
      const enriched = await enrichVulnSummaries(vulns);

      // Deduplicate by vuln ID
      const seen = new Set<string>();
      const vulnRows: {
        sbom_component_id: string;
        cve_id: string;
        description: string | null;
        severity: Severity;
        cvss_score: number | null;
        cisa_kev: boolean;
        discovery_date: string | null;
      }[] = [];

      let compCritical = 0;
      let compHigh = 0;

      for (const vuln of vulns) {
        const vulnId = extractVulnId(vuln);
        if (seen.has(vulnId)) continue;
        seen.add(vulnId);

        const score = extractCvssScore(vuln);
        const severity = cvssToSeverity(score);
        const isKev = kevCveIds.has(vulnId);

        // Use enriched summary if batch query didn't return one
        const enrichedData = enriched.get(vuln.id);
        const description =
          vuln.summary?.slice(0, 2000) ??
          enrichedData?.summary?.slice(0, 2000) ??
          null;

        vulnRows.push({
          sbom_component_id: component.id,
          cve_id: vulnId,
          description,
          severity,
          cvss_score: score,
          cisa_kev: isKev,
          discovery_date: vuln.published ?? null,
        });

        totalVulns++;
        if (severity === "critical") { totalCritical++; compCritical++; }
        else if (severity === "high") { totalHigh++; compHigh++; }
        else if (severity === "medium") totalMedium++;
        else totalLow++;
        if (isKev) totalKev++;
      }

      // Insert vulnerabilities in chunks
      const INSERT_CHUNK = 200;
      for (let k = 0; k < vulnRows.length; k += INSERT_CHUNK) {
        await supabase
          .from("vulnerabilities")
          .insert(vulnRows.slice(k, k + INSERT_CHUNK));
      }

      // Update component vuln counts
      await supabase
        .from("sbom_components")
        .update({
          vulnerability_count: vulnRows.length,
          critical_vulnerability_count: compCritical,
          high_vulnerability_count: compHigh,
        })
        .eq("id", component.id);
    }
  }

  // 6. Update SBOM aggregate counts
  await supabase
    .from("sboms")
    .update({
      last_scanned_at: new Date().toISOString(),
      components_with_vulnerabilities: componentsWithVulns,
      vulnerability_count: totalVulns,
      critical_count: totalCritical,
      high_count: totalHigh,
      medium_count: totalMedium,
      low_count: totalLow,
      kev_count: totalKev,
    })
    .eq("id", sbomId);

  await logActivity({ action: "sbom.scanned", targetType: "sbom", targetId: sbomId, metadata: { totalVulns, totalCritical, totalHigh } });

  return {};
}
