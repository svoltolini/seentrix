import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/entitlements";
import { hasFeature } from "@/lib/constants/plans";
import {
  buildSbom,
  sbomFilenameStem,
  type SbomExportFormat,
  type SbomExportComponent,
} from "@/lib/sbom/export";

/**
 * Stream a canonical SBOM (CycloneDX 1.6 or SPDX 2.3) built from a product's
 * stored components, stamped with the org's supplier metadata.
 *
 *   GET /api/products/:id/sbom/export?format=cyclonedx|spdx[&sbomId=...]
 *
 * Defaults to the product's active SBOM. Gated to plans with SBOM access
 * (Professional+). See @/lib/sbom/export.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const url = new URL(req.url);
  const formatParam = (url.searchParams.get("format") ?? "cyclonedx").toLowerCase();
  const format: SbomExportFormat = formatParam === "spdx" ? "spdx" : "cyclonedx";
  const requestedSbomId = url.searchParams.get("sbomId");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!hasFeature(await getOrgPlan(supabase, orgId), "sbom")) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  const [{ data: product }, { data: org }, { data: release }] = await Promise.all([
    supabase
      .from("products")
      .select("name")
      .eq("id", productId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("organizations")
      .select("name, legal_name, website")
      .eq("id", orgId)
      .single(),
    supabase
      .from("product_releases")
      .select("version, released_at")
      .eq("product_id", productId)
      .order("released_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!product || !org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const p = product as Record<string, string | null>;
  const o = org as Record<string, string | null>;

  // Resolve the SBOM: explicit id, else active, else most recent.
  let sbomId = requestedSbomId;
  if (!sbomId) {
    const { data: active } = await supabase
      .from("sboms")
      .select("id")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    sbomId = (active as { id: string } | null)?.id ?? null;
  }
  if (!sbomId) {
    const { data: latest } = await supabase
      .from("sboms")
      .select("id")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    sbomId = (latest as { id: string } | null)?.id ?? null;
  }
  if (!sbomId) {
    return NextResponse.json({ error: "no_sbom" }, { status: 409 });
  }

  const { data: rows, error } = await supabase
    .from("sbom_components")
    .select("component_name, component_version, purl, cpe, license, supplier")
    .eq("sbom_id", sbomId)
    .order("component_name", { ascending: true });
  if (error) return NextResponse.json({ error: "generic" }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "no_components" }, { status: 409 });
  }

  const components: SbomExportComponent[] = rows.map((row) => {
    const r = row as Record<string, string | null>;
    return {
      name: r.component_name ?? "unknown",
      version: r.component_version,
      purl: r.purl,
      cpe: r.cpe,
      license: r.license,
      supplier: r.supplier,
    };
  });

  const generatedAt = new Date().toISOString();
  const doc = buildSbom(format, {
    product: {
      name: p.name ?? "Product",
      version: (release as { version?: string } | null)?.version ?? null,
    },
    supplier: {
      name: o.legal_name?.trim() || o.name || "Manufacturer",
      url: o.website ?? null,
    },
    components,
    generatedAt,
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
  });

  const stem = sbomFilenameStem(format, p.name ?? "product", generatedAt);
  const ext = format === "spdx" ? "spdx.json" : "cdx.json";

  return new NextResponse(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stem}.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
