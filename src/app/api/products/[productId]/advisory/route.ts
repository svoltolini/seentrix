import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/entitlements";
import { hasFeature } from "@/lib/constants/plans";
import {
  buildAdvisory,
  advisoryFilenameStem,
  type AdvisoryFormat,
  type AdvisoryInput,
  type AdvisoryVulnerability,
} from "@/lib/advisory";

/**
 * Stream a machine-readable security advisory (CSAF 2.0 or CycloneDX VEX)
 * built from a product's triaged vulnerabilities.
 *
 *   GET /api/products/:productId/advisory?format=csaf      → CSAF 2.0 JSON
 *   GET /api/products/:productId/advisory?format=vex       → CycloneDX VEX JSON
 *
 * Gated to Business+ (the `vex_csaf` feature). The advisory reflects the
 * active SBOM's vulnerabilities; their triage state (status + resolution
 * type) drives the VEX/CSAF product status. See @/lib/advisory.
 */

function coerceFixedVersions(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    const strings = raw.filter((x): x is string => typeof x === "string");
    return strings.length > 0 ? strings : null;
  }
  return null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const url = new URL(req.url);
  const formatParam = (url.searchParams.get("format") ?? "csaf").toLowerCase();
  const format: AdvisoryFormat =
    formatParam === "vex" || formatParam === "cyclonedx-vex"
      ? "cyclonedx-vex"
      : "csaf";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Plan gate: VEX/CSAF export is a Business+ feature.
  if (!hasFeature(await getOrgPlan(supabase, orgId), "vex_csaf")) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  // Product + org (publisher) + latest release (product version).
  const [{ data: product }, { data: org }, { data: releases }] =
    await Promise.all([
      supabase
        .from("products")
        .select("name, type")
        .eq("id", productId)
        .eq("org_id", orgId)
        .single(),
      supabase
        .from("organizations")
        .select(
          "name, legal_name, website, slug, security_contact_email, contact_email",
        )
        .eq("id", orgId)
        .single(),
      supabase
        .from("product_releases")
        .select("version, released_at")
        .eq("product_id", productId)
        .order("released_at", { ascending: false })
        .limit(1),
    ]);

  if (!product || !org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const p = product as Record<string, string | null>;
  const o = org as Record<string, string | null>;

  // Active SBOM(s) for the product; fall back to all if none flagged active.
  const { data: activeSboms } = await supabase
    .from("sboms")
    .select("id")
    .eq("product_id", productId)
    .eq("is_active", true);
  let sbomIds = (activeSboms ?? []).map((s) => (s as { id: string }).id);
  if (sbomIds.length === 0) {
    const { data: allSboms } = await supabase
      .from("sboms")
      .select("id")
      .eq("product_id", productId);
    sbomIds = (allSboms ?? []).map((s) => (s as { id: string }).id);
  }
  if (sbomIds.length === 0) {
    return NextResponse.json({ error: "no_sbom" }, { status: 409 });
  }

  // Vulnerabilities joined to their component (same inner-join pattern the
  // list uses, to avoid a huge id-list `.in()`).
  const { data: vulnRows, error: vulnErr } = await supabase
    .from("vulnerabilities")
    .select(
      "cve_id, description, severity, cvss_score, cvss_v4_score, status, resolution_type, resolution_notes, resolved_at, discovery_date, fixed_versions, sbom_components!inner(component_name, component_version, purl, cpe, sbom_id)",
    )
    .in("sbom_components.sbom_id", sbomIds);
  if (vulnErr) {
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
  if (!vulnRows || vulnRows.length === 0) {
    return NextResponse.json({ error: "no_vulnerabilities" }, { status: 409 });
  }

  const vulnerabilities: AdvisoryVulnerability[] = vulnRows.map((row) => {
    const r = row as Record<string, unknown>;
    const embedded = r.sbom_components as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | null;
    const c = (Array.isArray(embedded) ? embedded[0] : embedded) ?? {};
    return {
      cveId: r.cve_id as string,
      description: (r.description as string | null) ?? null,
      severity: (r.severity as AdvisoryVulnerability["severity"]) ?? "low",
      cvssScore: (r.cvss_score as number | null) ?? null,
      cvssV4Score: (r.cvss_v4_score as number | null) ?? null,
      status: (r.status as AdvisoryVulnerability["status"]) ?? "open",
      resolutionType:
        (r.resolution_type as AdvisoryVulnerability["resolutionType"]) ?? null,
      resolutionNotes: (r.resolution_notes as string | null) ?? null,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      discoveryDate: (r.discovery_date as string | null) ?? null,
      componentName: (c.component_name as string) ?? "unknown",
      componentVersion: (c.component_version as string | null) ?? null,
      purl: (c.purl as string | null) ?? null,
      cpe: (c.cpe as string | null) ?? null,
      fixedVersions: coerceFixedVersions(r.fixed_versions),
    };
  });

  const publisherName = o.legal_name?.trim() || o.name || "Manufacturer";
  const namespace =
    o.website?.trim() ||
    (o.slug ? `https://seentrix.app/security/${o.slug}` : `urn:seentrix:org:${orgId}`);
  const version = (releases?.[0] as { version?: string } | undefined)?.version ?? null;
  const generatedAt = new Date().toISOString();
  const dateStamp = generatedAt.slice(0, 10).replace(/-/g, "");
  const idScope = (o.slug || orgId.slice(0, 8)).toUpperCase();
  const trackingId = `SEENTRIX-${idScope}-${productId.slice(0, 8).toUpperCase()}-${dateStamp}`;

  const input: AdvisoryInput = {
    publisher: {
      name: publisherName,
      namespace,
      contactDetails: o.security_contact_email || o.contact_email || null,
    },
    product: {
      id: productId,
      name: p.name ?? "Product",
      version,
    },
    trackingId,
    generatedAt,
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    vulnerabilities,
  };

  const doc = buildAdvisory(format, input);
  const stem = advisoryFilenameStem(format, input.product.name, generatedAt);
  const ext = format === "csaf" ? "csaf.json" : "vex.json";

  return new NextResponse(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stem}.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
