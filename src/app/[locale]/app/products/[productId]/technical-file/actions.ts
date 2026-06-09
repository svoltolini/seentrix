"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import {
  computeManifest,
  coverageScore,
  retentionUntil,
  TEST_REPORT_CATEGORIES,
  type ManifestInput,
  type ManifestEntry,
} from "@/lib/constants/annex-vii";

const PDF_BUCKET = "document-pdfs";
const DIAGRAMS_BUCKET = "product-diagrams";
const MAX_EMBEDDED_DIAGRAMS = 6;

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface TfVersionRow {
  id: string;
  version: number;
  status: "draft" | "released" | "archived";
  released_at: string | null;
  retention_until: string | null;
  has_pdf: boolean;
}

export interface TechnicalFileState {
  productName: string;
  canWrite: boolean;
  manifest: ManifestEntry[];
  score: ReturnType<typeof coverageScore>;
  currentId: string | null;
  currentStatus: "draft" | "released" | "archived" | null;
  currentVersion: number;
  history: TfVersionRow[];
}

// ---------------------------------------------------------------------------
// Auth + role gating (mirrors the other product surfaces)
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, orgId: null, role: null };
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? null;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data as { role: string } | null)?.role ?? null;
  return { supabase, user, orgId, role };
}

const ROLES_CAN_WRITE = new Set(["admin", "compliance_officer", "cto", "editor"]);
function canWrite(r: string | null) {
  return !!r && ROLES_CAN_WRITE.has(r);
}

function parseContent(content: string | null): Record<string, string> {
  if (!content) return {};
  try {
    return JSON.parse(content) as Record<string, string>;
  } catch {
    return {};
  }
}
const filled = (v: string | undefined) => !!v && v.trim().length > 0;

// ---------------------------------------------------------------------------
// Gather — single read of every surface the technical file compiles
// ---------------------------------------------------------------------------

interface Gathered {
  product: Record<string, unknown>;
  org: Record<string, string | null>;
  releases: { version: string; released_at: string; release_type: string }[];
  diagrams: { id: string; type: string; title: string; preview_url: string | null }[];
  sbom: Record<string, number | string | null> | null;
  evidence: { category: string; title: string; annex_vii_point: string | null }[];
  ra: { status: string; version: number; released_at: string | null } | null;
  raDraft: boolean;
  raItems: { applicability: string | null }[];
  docs: Record<string, { status: string; content: Record<string, string> }>;
  input: ManifestInput;
}

async function gather(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  orgId: string,
): Promise<Gathered | null> {
  const { data: product } = await supabase
    .from("products")
    .select(
      "name, description, intended_use, connectivity, type, cra_category, support_period_start, support_period_end, update_channel",
    )
    .eq("id", productId)
    .single();
  if (!product) return null;

  const [
    { data: org },
    { data: releases },
    { data: diagrams },
    { data: sbomRows },
    { data: evidence },
    { data: raRows },
    { data: docRows },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "legal_name, name, registration_number, address_line1, address_line2, postal_code, city, country, security_contact_email, signatory_name, signatory_position",
      )
      .eq("id", orgId)
      .maybeSingle(),
    supabase
      .from("product_releases")
      .select("version, released_at, release_type")
      .eq("product_id", productId)
      .order("released_at", { ascending: false }),
    supabase
      .from("product_diagrams")
      .select("id, type, title, preview_url")
      .eq("product_id", productId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("sboms")
      .select(
        "sbom_format, total_components, critical_count, high_count, medium_count, low_count, kev_count",
      )
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("product_evidence")
      .select("category, title, annex_vii_point")
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
    supabase
      .from("risk_assessments")
      .select("id, status, version, released_at")
      .eq("product_id", productId)
      .order("version", { ascending: false }),
    supabase
      .from("documents")
      .select("document_type, status, content")
      .eq("product_id", productId),
  ]);

  const releasesList =
    (releases as { version: string; released_at: string; release_type: string }[] | null) ??
    [];
  const diagramsList =
    (diagrams as { id: string; type: string; title: string; preview_url: string | null }[] | null) ??
    [];
  const sbom = (sbomRows as Record<string, number | string | null>[] | null)?.[0] ?? null;
  const evidenceList =
    (evidence as { category: string; title: string; annex_vii_point: string | null }[] | null) ??
    [];
  const raAll =
    (raRows as { id: string; status: string; version: number; released_at: string | null }[] | null) ??
    [];
  const releasedRa = raAll.find((r) => r.status === "released") ?? null;
  const raDraft = raAll.some((r) => r.status === "draft");

  // Items for the released RA (for the summary counts).
  let raItems: { applicability: string | null }[] = [];
  if (releasedRa) {
    const { data: items } = await supabase
      .from("risk_assessment_items")
      .select("applicability")
      .eq("risk_assessment_id", releasedRa.id);
    raItems = (items as { applicability: string | null }[] | null) ?? [];
  }

  const docs: Record<string, { status: string; content: Record<string, string> }> = {};
  for (const d of (docRows as { document_type: string; status: string; content: string | null }[] | null) ?? []) {
    docs[d.document_type] = { status: d.status, content: parseContent(d.content) };
  }

  const p = product as Record<string, unknown>;
  const doc = docs["declaration_of_conformity"];
  const vdp = docs["vulnerability_disclosure_policy"];
  const techDoc = docs["technical_documentation"];
  const evCategories = new Set(evidenceList.map((e) => e.category));

  const input: ManifestInput = {
    hasDescription: filled(p.description as string | undefined),
    hasIntendedUse: filled(p.intended_use as string | undefined),
    releasesCount: releasesList.length,
    isHardware: p.type === "hardware",
    hasHardwarePhoto:
      evCategories.has("hardware_photo") ||
      diagramsList.some((d) => d.type === "hardware_layout"),
    hasArchitectureDiagram: diagramsList.some(
      (d) => d.type === "architecture" || d.type === "data_flow",
    ),
    hasAnyDiagram: diagramsList.length > 0,
    hasActiveSbom: !!sbom,
    hasVdpPolicy: !!vdp && vdp.status !== "not_started",
    hasSecurityContact: filled((org as Record<string, string | null> | null)?.security_contact_email ?? undefined),
    hasUpdateMechanism:
      filled(techDoc?.content.update_mechanism) ||
      filled(p.update_channel as string | undefined),
    hasProductionInfo:
      filled(techDoc?.content.development_process) ||
      filled(techDoc?.content.testing_results),
    hasReleasedRiskAssessment: !!releasedRa,
    hasDraftRiskAssessment: raDraft,
    hasSupportStart: filled(p.support_period_start as string | undefined),
    hasSupportEnd: filled(p.support_period_end as string | undefined),
    hasStandards: filled(doc?.content.standards_applied),
    hasTestReports: [...evCategories].some((c) =>
      (TEST_REPORT_CATEGORIES as readonly string[]).includes(c),
    ),
    hasOtherEvidence:
      evCategories.has("due_diligence") || evCategories.has("other"),
    docStatus: (doc?.status as "final" | "draft" | "not_started") ?? "not_started",
  };

  return {
    product: p,
    org: (org as Record<string, string | null>) ?? {},
    releases: releasesList,
    diagrams: diagramsList,
    sbom,
    evidence: evidenceList,
    ra: releasedRa,
    raDraft,
    raItems,
    docs,
    input,
  };
}

// ---------------------------------------------------------------------------
// Load (live coverage + version history)
// ---------------------------------------------------------------------------

export async function loadTechnicalFile(
  productId: string,
): Promise<{ state: TechnicalFileState | null; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const gathered = await gather(supabase, productId, orgId);
  if (!gathered) return { state: null, error: "notFound" };

  const manifest = computeManifest(gathered.input);

  const { data: rows } = await supabase
    .from("technical_files")
    .select("id, status, version, released_at, retention_until, pdf_url")
    .eq("product_id", productId)
    .order("version", { ascending: false });
  const all =
    (rows as {
      id: string;
      status: "draft" | "released" | "archived";
      version: number;
      released_at: string | null;
      retention_until: string | null;
      pdf_url: string | null;
    }[] | null) ?? [];

  const current = all.find((r) => r.status === "draft") ?? all[0] ?? null;
  const history: TfVersionRow[] = all
    .filter((r) => r.status !== "draft")
    .map((r) => ({
      id: r.id,
      version: r.version,
      status: r.status,
      released_at: r.released_at,
      retention_until: r.retention_until,
      has_pdf: !!r.pdf_url,
    }));

  return {
    state: {
      productName: (gathered.product.name as string) ?? "",
      canWrite: canWrite(role),
      manifest,
      score: coverageScore(manifest),
      currentId: current?.id ?? null,
      currentStatus: current?.status ?? null,
      currentVersion: current?.version ?? 1,
      history,
    },
  };
}

// ---------------------------------------------------------------------------
// Assemble (regenerate the draft PDF + manifest from live data)
// ---------------------------------------------------------------------------

async function getOrCreateDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  orgId: string,
  userId: string,
): Promise<{ id?: string; version?: number; error?: string }> {
  const { data: rows } = await supabase
    .from("technical_files")
    .select("id, status, version")
    .eq("product_id", productId)
    .order("version", { ascending: false });
  const all = (rows as { id: string; status: string; version: number }[] | null) ?? [];
  const draft = all.find((r) => r.status === "draft");
  if (draft) return { id: draft.id, version: draft.version };
  const nextVersion = (all[0]?.version ?? 0) + 1;
  const { data: inserted, error } = await supabase
    .from("technical_files")
    .insert({
      product_id: productId,
      org_id: orgId,
      status: "draft",
      version: nextVersion,
      created_by: userId,
    })
    .select("id, version")
    .single();
  if (error || !inserted) return { error: "generic" };
  return {
    id: (inserted as { id: string }).id,
    version: (inserted as { version: number }).version,
  };
}

export async function assembleTechnicalFile(
  productId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  // Plan gate: PDF generation is a paid feature.
  {
    const { canGeneratePdf } = await import("@/lib/constants/plans");
    const { getOrgPlan } = await import("@/lib/entitlements");
    if (!canGeneratePdf(await getOrgPlan(supabase, orgId)))
      return { error: "planRequired" };
  }

  const draft = await getOrCreateDraft(supabase, productId, orgId, user.id);
  if (draft.error || !draft.id) return { error: draft.error ?? "generic" };

  const result = await buildAndStorePdf(
    supabase,
    orgId,
    productId,
    draft.id,
    draft.version ?? 1,
    null,
  );
  if (result.error) return { error: result.error };

  await logActivity({
    action: "technical_file.assembled",
    targetType: "technical_file",
    targetId: draft.id,
    metadata: { productId },
  });
  revalidatePath(`/app/products/${productId}/technical-file`);
  return { url: result.url };
}

// ---------------------------------------------------------------------------
// Release (lock the draft + stamp retention)
// ---------------------------------------------------------------------------

export async function releaseTechnicalFile(
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  // Plan gate: releasing produces a PDF, a paid feature.
  {
    const { canGeneratePdf } = await import("@/lib/constants/plans");
    const { getOrgPlan } = await import("@/lib/entitlements");
    if (!canGeneratePdf(await getOrgPlan(supabase, orgId)))
      return { error: "planRequired" };
  }

  const draft = await getOrCreateDraft(supabase, productId, orgId, user.id);
  if (draft.error || !draft.id) return { error: draft.error ?? "generic" };

  // Support-period end → retention extension.
  const { data: product } = await supabase
    .from("products")
    .select("support_period_end")
    .eq("id", productId)
    .single();
  const supportEnd = (product as { support_period_end: string | null } | null)
    ?.support_period_end;
  const releasedAt = new Date();
  const retention = retentionUntil(
    releasedAt,
    supportEnd ? new Date(supportEnd) : null,
  );

  // Regenerate the final PDF + manifest snapshot at release time.
  const result = await buildAndStorePdf(
    supabase,
    orgId,
    productId,
    draft.id,
    draft.version ?? 1,
    retention.toISOString(),
  );
  if (result.error) return { error: result.error };

  const { error } = await supabase
    .from("technical_files")
    .update({
      status: "released",
      released_at: releasedAt.toISOString(),
      retention_until: retention.toISOString(),
      updated_at: releasedAt.toISOString(),
    })
    .eq("id", draft.id);
  if (error) return { error: "generic" };

  await logActivity({
    action: "technical_file.released",
    targetType: "technical_file",
    targetId: draft.id,
    metadata: { productId, version: draft.version, retentionUntil: retention.toISOString() },
  });
  revalidatePath(`/app/products/${productId}/technical-file`);
  return {};
}

export async function newTechnicalFileVersion(
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data: rows } = await supabase
    .from("technical_files")
    .select("status, version")
    .eq("product_id", productId)
    .order("version", { ascending: false });
  const all = (rows as { status: string; version: number }[] | null) ?? [];
  if (all.some((r) => r.status === "draft")) return { error: "draftExists" };
  if (all.length === 0) return { error: "noVersions" };

  const { error } = await supabase.from("technical_files").insert({
    product_id: productId,
    org_id: orgId,
    status: "draft",
    version: all[0].version + 1,
    created_by: user.id,
  });
  if (error) return { error: "generic" };
  revalidatePath(`/app/products/${productId}/technical-file`);
  return {};
}

export async function downloadTechnicalFile(
  id: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  const { data: row } = await supabase
    .from("technical_files")
    .select("pdf_url")
    .eq("id", id)
    .single();
  const path = (row as { pdf_url: string | null } | null)?.pdf_url;
  if (!path) return { error: "noPdf" };
  const { data: signed, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !signed?.signedUrl) return { error: "noPdf" };
  return { url: signed.signedUrl };
}

/** Soft-archive a released version (released files are never hard-deleted). */
export async function archiveTechnicalFile(
  productId: string,
  id: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const { error } = await supabase
    .from("technical_files")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "released");
  if (error) return { error: "generic" };
  revalidatePath(`/app/products/${productId}/technical-file`);
  return {};
}

// ---------------------------------------------------------------------------
// PDF build — gather, embed diagram PNGs, localize, render, upload, store
// ---------------------------------------------------------------------------

async function buildAndStorePdf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  productId: string,
  technicalFileId: string,
  version: number,
  retentionIso: string | null,
): Promise<{ url?: string; error?: string }> {
  const { getLocale, getTranslations } = await import("next-intl/server");
  const { isLocale } = await import("@/i18n/locales");
  const { generateTechnicalFilePdf } = await import(
    "@/lib/pdf/generate-technical-file"
  );
  const resolved = await getLocale();
  const locale = isLocale(resolved) ? resolved : "en";

  const gathered = await gather(supabase, productId, orgId);
  if (!gathered) return { error: "notFound" };
  const manifest = computeManifest(gathered.input);

  const tp = await getTranslations({ locale, namespace: "technical-file" });

  // Embed up to N diagram preview PNGs as base64 data URIs.
  const diagramsWithImages = await Promise.all(
    gathered.diagrams.slice(0, MAX_EMBEDDED_DIAGRAMS).map(async (d) => {
      let imageDataUri: string | null = null;
      if (d.preview_url) {
        const { data: blob } = await supabase.storage
          .from(DIAGRAMS_BUCKET)
          .download(d.preview_url);
        if (blob) {
          const buf = Buffer.from(await blob.arrayBuffer());
          imageDataUri = `data:image/png;base64,${buf.toString("base64")}`;
        }
      }
      return {
        title: d.title,
        type: tp(`diagramTypes.${d.type}`),
        imageDataUri,
      };
    }),
  );

  const p = gathered.product;
  const o = gathered.org;
  const doc = gathered.docs["declaration_of_conformity"];
  const techDoc = gathered.docs["technical_documentation"];
  const manufacturer = o.legal_name || o.name || "";
  const manufacturerAddress = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ]
    .filter(Boolean)
    .join(", ");

  const raApplies = gathered.raItems.filter((i) => i.applicability === "applies").length;
  const raNa = gathered.raItems.filter((i) => i.applicability === "not_applicable").length;

  const data = {
    productName: (p.name as string) ?? "",
    version,
    retentionUntil: retentionIso ? new Date(retentionIso).toLocaleDateString() : null,
    manifest: manifest.map((e) => ({
      ref: e.ref,
      label: tp(`points.${e.point}`),
      coverage: e.coverage,
    })),
    description: (p.description as string) ?? "",
    intendedUse: (p.intended_use as string) ?? "",
    connectivity: (p.connectivity as string) ?? "",
    productType: (p.type as string) ?? "",
    craCategory: (p.cra_category as string) ?? "",
    manufacturer,
    manufacturerAddress,
    versions: gathered.releases.map((r) => ({
      version: r.version,
      releasedAt: r.released_at,
      type: r.release_type,
    })),
    diagrams: diagramsWithImages,
    sbom: gathered.sbom
      ? {
          format: String(gathered.sbom.sbom_format ?? ""),
          components: Number(gathered.sbom.total_components ?? 0),
          critical: Number(gathered.sbom.critical_count ?? 0),
          high: Number(gathered.sbom.high_count ?? 0),
          medium: Number(gathered.sbom.medium_count ?? 0),
          low: Number(gathered.sbom.low_count ?? 0),
          kev: Number(gathered.sbom.kev_count ?? 0),
        }
      : null,
    vdpPresent: gathered.input.hasVdpPolicy,
    securityContact: o.security_contact_email ?? "",
    updateMechanism:
      techDoc?.content.update_mechanism ||
      (p.update_channel as string) ||
      "",
    production:
      techDoc?.content.development_process ||
      techDoc?.content.testing_results ||
      "",
    riskAssessment: gathered.ra
      ? {
          version: gathered.ra.version,
          releasedAt: gathered.ra.released_at
            ? new Date(gathered.ra.released_at).toLocaleDateString()
            : "",
          applies: raApplies,
          notApplicable: raNa,
          unmapped: Math.max(0, 21 - raApplies - raNa),
        }
      : null,
    supportStart: (p.support_period_start as string) ?? "",
    supportEnd: (p.support_period_end as string) ?? "",
    standards: doc?.content.standards_applied ?? "",
    evidence: gathered.evidence.map((e) => ({
      title: e.title,
      category: tp(`evidenceCategories.${e.category}`),
      annexPoint: e.annex_vii_point,
    })),
    docStatus: doc ? tp(`docStatus.${doc.status}`) : tp("docStatus.not_started"),
    docSignatory:
      doc?.content.signatory_name ||
      [o.signatory_name, o.signatory_position].filter(Boolean).join(", "),
  };

  const messages: Record<string, string> = {
    title: tp("pdf.title"),
    version: tp("pdf.version"),
    retainedUntil: tp("pdf.retainedUntil"),
    retentionNote: tp("pdf.retentionNote"),
    coverageHeading: tp("pdf.coverageHeading"),
    coverage_present: tp("coverage.present"),
    coverage_partial: tp("coverage.partial"),
    coverage_missing: tp("coverage.missing"),
    none: tp("pdf.none"),
    noPreview: tp("pdf.noPreview"),
    missingDiagrams: tp("pdf.missingDiagrams"),
    missingRa: tp("pdf.missingRa"),
    missingEvidence: tp("pdf.missingEvidence"),
    components: tp("pdf.components"),
    yes: tp("pdf.yes"),
    raApplies: tp("pdf.raApplies"),
    raNa: tp("pdf.raNa"),
    raUnmapped: tp("pdf.raUnmapped"),
    f_manufacturer: tp("pdf.f_manufacturer"),
    f_address: tp("pdf.f_address"),
    f_description: tp("pdf.f_description"),
    f_intendedUse: tp("pdf.f_intendedUse"),
    f_connectivity: tp("pdf.f_connectivity"),
    f_type: tp("pdf.f_type"),
    f_versions: tp("pdf.f_versions"),
    f_sbom: tp("pdf.f_sbom"),
    f_vdp: tp("pdf.f_vdp"),
    f_securityContact: tp("pdf.f_securityContact"),
    f_updateMechanism: tp("pdf.f_updateMechanism"),
    f_production: tp("pdf.f_production"),
    f_raReleased: tp("pdf.f_raReleased"),
    f_supportPeriod: tp("pdf.f_supportPeriod"),
    f_standards: tp("pdf.f_standards"),
    f_docStatus: tp("pdf.f_docStatus"),
    f_signatory: tp("pdf.f_signatory"),
    point_general_description: tp("points.general_description"),
    point_design_architecture: tp("points.design_architecture"),
    point_vuln_handling: tp("points.vuln_handling"),
    point_production_monitoring: tp("points.production_monitoring"),
    point_risk_assessment: tp("points.risk_assessment"),
    point_support_period: tp("points.support_period"),
    point_standards: tp("points.standards"),
    point_test_reports: tp("points.test_reports"),
    point_declaration_of_conformity: tp("points.declaration_of_conformity"),
  };

  const dateLocaleTag: Record<string, string> = {
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    it: "it-IT",
  };
  const generatedAt = new Date().toLocaleDateString(
    dateLocaleTag[locale] ?? "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const buffer = await generateTechnicalFilePdf({ data, messages, generatedAt });

  const storagePath = `${orgId}/${productId}/technical-file_${technicalFileId}.pdf`;
  await supabase.storage.from(PDF_BUCKET).remove([storagePath]);
  const { error: uploadError } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) return { error: "generic" };

  await supabase
    .from("technical_files")
    .update({
      pdf_url: storagePath,
      manifest: manifest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", technicalFileId);

  const { data: signed } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, 3600);
  return { url: signed?.signedUrl };
}
