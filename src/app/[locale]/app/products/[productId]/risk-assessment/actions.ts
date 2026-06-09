"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { CRA_REQUIREMENTS } from "@/lib/constants/cra-requirements";
import { inherentRisk } from "@/lib/constants/risk-matrix";
import {
  REQUIREMENT_IDS,
  isApplicability,
  isLikelihood,
  isImpact,
  isResidual,
  type Applicability,
  type Likelihood,
  type Impact,
  type ResidualRisk,
  type RaStatus,
} from "./constants";

const PDF_BUCKET = "document-pdfs";

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface RaContextInput {
  intendedPurpose: string;
  operationalEnvironment: string;
  assetsToProtect: string;
  expectedLifetime: string;
}

export interface RaItemInput {
  requirementId: string;
  applicability: Applicability | null;
  threat: string;
  likelihood: Likelihood | "";
  impact: Impact | "";
  implementation: string;
  residualRisk: ResidualRisk | "";
  justification: string;
}

export interface RaItem {
  requirementId: string;
  part: "part_i" | "part_ii";
  article: string;
  applicability: Applicability | null;
  threat: string;
  likelihood: Likelihood | null;
  impact: Impact | null;
  implementation: string;
  residualRisk: ResidualRisk | null;
  justification: string;
}

export interface RaVersion {
  id: string;
  version: number;
  status: RaStatus;
  released_at: string | null;
  has_pdf: boolean;
}

export interface RiskAssessmentState {
  productName: string;
  canWrite: boolean;
  assessmentId: string | null;
  status: RaStatus | null;
  version: number;
  /** True when the current row is a released (immutable) snapshot. */
  readOnly: boolean;
  context: RaContextInput;
  items: RaItem[];
  history: RaVersion[];
}

// ---------------------------------------------------------------------------
// Auth + role gating (mirrors the diagrams / conformity surfaces)
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

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);
function canWrite(r: string | null) {
  return !!r && ROLES_CAN_WRITE.has(r);
}

type StoredItem = {
  requirement_id: string;
  applicability: Applicability | null;
  threat: string | null;
  likelihood: Likelihood | null;
  impact: Impact | null;
  implementation: string | null;
  residual_risk: ResidualRisk | null;
  justification: string | null;
};

function mergeItems(stored: StoredItem[]): RaItem[] {
  const byId = new Map(stored.map((s) => [s.requirement_id, s]));
  return CRA_REQUIREMENTS.map((req) => {
    const s = byId.get(req.id);
    return {
      requirementId: req.id,
      part: req.part,
      article: req.article,
      applicability: s?.applicability ?? null,
      threat: s?.threat ?? "",
      likelihood: s?.likelihood ?? null,
      impact: s?.impact ?? null,
      implementation: s?.implementation ?? "",
      residualRisk: s?.residual_risk ?? null,
      justification: s?.justification ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadRiskAssessment(
  productId: string,
): Promise<{ state: RiskAssessmentState | null; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .single();
  if (!product) return { state: null, error: "notFound" };

  const { data: rows } = await supabase
    .from("risk_assessments")
    .select(
      "id, intended_purpose, operational_environment, assets_to_protect, expected_lifetime, status, version, released_at, pdf_url",
    )
    .eq("product_id", productId)
    .order("version", { ascending: false });

  const all = (rows ?? []) as Array<{
    id: string;
    intended_purpose: string | null;
    operational_environment: string | null;
    assets_to_protect: string | null;
    expected_lifetime: string | null;
    status: RaStatus;
    version: number;
    released_at: string | null;
    pdf_url: string | null;
  }>;

  const history: RaVersion[] = all
    .filter((r) => r.status === "released")
    .map((r) => ({
      id: r.id,
      version: r.version,
      status: r.status,
      released_at: r.released_at,
      has_pdf: !!r.pdf_url,
    }));

  // Current = the editable draft if one exists, else the latest (released) row.
  const current = all.find((r) => r.status === "draft") ?? all[0] ?? null;

  let items: RaItem[] = mergeItems([]);
  if (current) {
    const { data: itemRows } = await supabase
      .from("risk_assessment_items")
      .select(
        "requirement_id, applicability, threat, likelihood, impact, implementation, residual_risk, justification",
      )
      .eq("risk_assessment_id", current.id);
    items = mergeItems((itemRows ?? []) as StoredItem[]);
  }

  return {
    state: {
      productName: (product as { name: string }).name ?? "",
      canWrite: canWrite(role),
      assessmentId: current?.id ?? null,
      status: current?.status ?? null,
      version: current?.version ?? 1,
      readOnly: current?.status === "released",
      context: {
        intendedPurpose: current?.intended_purpose ?? "",
        operationalEnvironment: current?.operational_environment ?? "",
        assetsToProtect: current?.assets_to_protect ?? "",
        expectedLifetime: current?.expected_lifetime ?? "",
      },
      items,
      history,
    },
  };
}

// ---------------------------------------------------------------------------
// Save (draft only)
// ---------------------------------------------------------------------------

async function getOrCreateDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  orgId: string,
  userId: string,
): Promise<{ id?: string; error?: string }> {
  const { data: existing } = await supabase
    .from("risk_assessments")
    .select("id, status, version")
    .eq("product_id", productId)
    .order("version", { ascending: false });

  const rows = (existing ?? []) as Array<{
    id: string;
    status: RaStatus;
    version: number;
  }>;
  const draft = rows.find((r) => r.status === "draft");
  if (draft) return { id: draft.id };
  if (rows.length > 0) {
    // Latest is released and no draft exists — caller must revise first.
    return { error: "released" };
  }
  const { data: inserted, error } = await supabase
    .from("risk_assessments")
    .insert({
      product_id: productId,
      org_id: orgId,
      status: "draft",
      version: 1,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: "generic" };
  return { id: (inserted as { id: string }).id };
}

export async function saveRiskAssessment(
  productId: string,
  context: RaContextInput,
  items: RaItemInput[],
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { id: assessmentId, error: draftError } = await getOrCreateDraft(
    supabase,
    productId,
    orgId,
    user.id,
  );
  if (draftError || !assessmentId) return { error: draftError ?? "generic" };

  const { error: ctxError } = await supabase
    .from("risk_assessments")
    .update({
      intended_purpose: context.intendedPurpose || null,
      operational_environment: context.operationalEnvironment || null,
      assets_to_protect: context.assetsToProtect || null,
      expected_lifetime: context.expectedLifetime || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId);
  if (ctxError) return { error: "generic" };

  // Only persist items for known requirement ids; empty enum strings → null.
  const known = new Set(REQUIREMENT_IDS);
  const rows = items
    .filter((it) => known.has(it.requirementId))
    .map((it) => ({
      risk_assessment_id: assessmentId,
      org_id: orgId,
      requirement_id: it.requirementId,
      applicability: isApplicability(it.applicability) ? it.applicability : null,
      threat: it.threat || null,
      likelihood: isLikelihood(it.likelihood) ? it.likelihood : null,
      impact: isImpact(it.impact) ? it.impact : null,
      implementation: it.implementation || null,
      residual_risk: isResidual(it.residualRisk) ? it.residualRisk : null,
      justification: it.justification || null,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    const { error: itemsError } = await supabase
      .from("risk_assessment_items")
      .upsert(rows, { onConflict: "risk_assessment_id,requirement_id" });
    if (itemsError) return { error: "generic" };
  }

  revalidatePath(`/app/products/${productId}/risk-assessment`);
  return {};
}

// ---------------------------------------------------------------------------
// Release (lock current draft + generate PDF)
// ---------------------------------------------------------------------------

export async function releaseRiskAssessment(
  productId: string,
): Promise<{ error?: string; missing?: number }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data: draftRow } = await supabase
    .from("risk_assessments")
    .select("id, version")
    .eq("product_id", productId)
    .eq("status", "draft")
    .maybeSingle();
  const draft = draftRow as { id: string; version: number } | null;
  if (!draft) return { error: "noDraft" };

  const { data: itemRows } = await supabase
    .from("risk_assessment_items")
    .select(
      "requirement_id, applicability, threat, likelihood, impact, implementation, residual_risk, justification",
    )
    .eq("risk_assessment_id", draft.id);
  const merged = mergeItems((itemRows ?? []) as StoredItem[]);

  // Validation: every requirement must be decided; applies → implementation,
  // not_applicable → justification (Art 13(4)).
  const missing = merged.filter((it) => {
    if (it.applicability === "applies") return !it.implementation.trim();
    if (it.applicability === "not_applicable") return !it.justification.trim();
    return true; // undecided
  });
  if (missing.length > 0) return { error: "incomplete", missing: missing.length };

  // Generate + store the PDF before flipping the status.
  const pdfPath = await buildAndUploadPdf(supabase, orgId, productId, draft.id);

  const { error } = await supabase
    .from("risk_assessments")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
      pdf_url: pdfPath ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draft.id);
  if (error) return { error: "generic" };

  await logActivity({
    action: "risk_assessment.released",
    targetType: "risk_assessment",
    targetId: draft.id,
    metadata: { productId, version: draft.version },
  });
  revalidatePath(`/app/products/${productId}/risk-assessment`);
  return {};
}

// ---------------------------------------------------------------------------
// Revise (clone latest released into a new draft)
// ---------------------------------------------------------------------------

export async function reviseRiskAssessment(
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data: rows } = await supabase
    .from("risk_assessments")
    .select(
      "id, status, version, intended_purpose, operational_environment, assets_to_protect, expected_lifetime",
    )
    .eq("product_id", productId)
    .order("version", { ascending: false });
  const all = (rows ?? []) as Array<{
    id: string;
    status: RaStatus;
    version: number;
    intended_purpose: string | null;
    operational_environment: string | null;
    assets_to_protect: string | null;
    expected_lifetime: string | null;
  }>;
  if (all.some((r) => r.status === "draft")) return { error: "draftExists" };
  const latest = all[0];
  if (!latest) return { error: "noVersions" };

  const { data: inserted, error } = await supabase
    .from("risk_assessments")
    .insert({
      product_id: productId,
      org_id: orgId,
      intended_purpose: latest.intended_purpose,
      operational_environment: latest.operational_environment,
      assets_to_protect: latest.assets_to_protect,
      expected_lifetime: latest.expected_lifetime,
      status: "draft",
      version: latest.version + 1,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: "generic" };
  const newId = (inserted as { id: string }).id;

  // Copy the previous version's items into the new draft.
  const { data: prevItems } = await supabase
    .from("risk_assessment_items")
    .select(
      "requirement_id, applicability, threat, likelihood, impact, implementation, residual_risk, justification",
    )
    .eq("risk_assessment_id", latest.id);
  const clones = ((prevItems ?? []) as StoredItem[]).map((it) => ({
    risk_assessment_id: newId,
    org_id: orgId,
    requirement_id: it.requirement_id,
    applicability: it.applicability,
    threat: it.threat,
    likelihood: it.likelihood,
    impact: it.impact,
    implementation: it.implementation,
    residual_risk: it.residual_risk,
    justification: it.justification,
  }));
  if (clones.length > 0) {
    await supabase.from("risk_assessment_items").insert(clones);
  }

  revalidatePath(`/app/products/${productId}/risk-assessment`);
  return {};
}

// ---------------------------------------------------------------------------
// PDF — (re)generate for a version, or sign an existing one
// ---------------------------------------------------------------------------

export async function generateVersionPdf(
  productId: string,
  assessmentId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  // Plan gate: PDF generation is a paid feature.
  {
    const { canGeneratePdf } = await import("@/lib/constants/plans");
    const { getOrgPlan } = await import("@/lib/entitlements");
    if (!canGeneratePdf(await getOrgPlan(supabase, orgId)))
      return { error: "planRequired" };
  }

  const path = await buildAndUploadPdf(supabase, orgId, productId, assessmentId);
  if (!path) return { error: "generic" };

  await supabase
    .from("risk_assessments")
    .update({ pdf_url: path })
    .eq("id", assessmentId);

  const { data: signed, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !signed?.signedUrl) return { error: "generic" };
  return { url: signed.signedUrl };
}

export async function downloadVersionPdf(
  assessmentId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };

  const { data: row } = await supabase
    .from("risk_assessments")
    .select("pdf_url")
    .eq("id", assessmentId)
    .single();
  const path = (row as { pdf_url: string | null } | null)?.pdf_url;
  if (!path) return { error: "noPdf" };

  const { data: signed, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !signed?.signedUrl) return { error: "noPdf" };
  return { url: signed.signedUrl };
}

/**
 * Build the localized PDF for one assessment version and upload it to the
 * document-pdfs bucket under `<org>/<product>/risk-assessment_<id>.pdf`.
 * Returns the storage path (or null on failure). Localization uses the
 * caller's UI locale, like the documents pipeline.
 */
async function buildAndUploadPdf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  productId: string,
  assessmentId: string,
): Promise<string | null> {
  const { getLocale, getTranslations } = await import("next-intl/server");
  const { isLocale } = await import("@/i18n/locales");
  const { generateRiskAssessmentPdf } = await import(
    "@/lib/pdf/generate-risk-assessment"
  );
  const resolved = await getLocale();
  const locale = isLocale(resolved) ? resolved : "en";

  const [{ data: ra }, { data: product }, { data: itemRows }] =
    await Promise.all([
      supabase
        .from("risk_assessments")
        .select(
          "intended_purpose, operational_environment, assets_to_protect, expected_lifetime, version",
        )
        .eq("id", assessmentId)
        .single(),
      supabase.from("products").select("name").eq("id", productId).single(),
      supabase
        .from("risk_assessment_items")
        .select(
          "requirement_id, applicability, threat, likelihood, impact, implementation, residual_risk, justification",
        )
        .eq("risk_assessment_id", assessmentId),
    ]);
  if (!ra) return null;

  const tReq = await getTranslations({ locale, namespace: "checklist" });
  const tPdf = await getTranslations({ locale, namespace: "risk-assessment" });

  const merged = mergeItems((itemRows ?? []) as StoredItem[]);
  const toPdfItem = (it: RaItem) => ({
    requirementTitle: tReq(`requirements.${it.requirementId}.title`),
    article: it.article,
    applicability: it.applicability,
    threat: it.threat,
    likelihood: it.likelihood ?? "",
    impact: it.impact ?? "",
    inherentBand:
      it.likelihood && it.impact ? inherentRisk(it.likelihood, it.impact) : "",
    implementation: it.implementation,
    residualRisk: it.residualRisk ?? "",
    justification: it.justification,
  });

  const raRow = ra as {
    intended_purpose: string | null;
    operational_environment: string | null;
    assets_to_protect: string | null;
    expected_lifetime: string | null;
    version: number;
  };

  const data = {
    productName: (product as { name: string } | null)?.name ?? "",
    version: raRow.version,
    intendedPurpose: raRow.intended_purpose ?? "",
    operationalEnvironment: raRow.operational_environment ?? "",
    assetsToProtect: raRow.assets_to_protect ?? "",
    expectedLifetime: raRow.expected_lifetime ?? "",
    partI: merged.filter((i) => i.part === "part_i").map(toPdfItem),
    partII: merged.filter((i) => i.part === "part_ii").map(toPdfItem),
  };

  const messages: Record<string, string> = {
    title: tPdf("pdf.title"),
    versionLabel: tPdf("pdf.version"),
    contextHeading: tPdf("pdf.contextHeading"),
    intendedPurpose: tPdf("context.intendedPurpose"),
    operationalEnvironment: tPdf("context.operationalEnvironment"),
    assetsToProtect: tPdf("context.assetsToProtect"),
    expectedLifetime: tPdf("context.expectedLifetime"),
    partI: tPdf("parts.part_i"),
    partII: tPdf("parts.part_ii"),
    applies: tPdf("applicability.applies"),
    notApplicable: tPdf("applicability.not_applicable"),
    notAssessed: tPdf("pdf.notAssessed"),
    threat: tPdf("item.threat"),
    likelihood: tPdf("item.likelihood"),
    impact: tPdf("item.impact"),
    inherentRisk: tPdf("item.inherentRisk"),
    implementation: tPdf("item.implementation"),
    residualRisk: tPdf("item.residualRisk"),
    justification: tPdf("item.justification"),
    levelLow: tPdf("levels.low"),
    levelMedium: tPdf("levels.medium"),
    levelHigh: tPdf("levels.high"),
    levelCritical: tPdf("levels.critical"),
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

  const buffer = await generateRiskAssessmentPdf({ data, messages, generatedAt });

  const storagePath = `${orgId}/${productId}/risk-assessment_${assessmentId}.pdf`;
  // Remove any prior file at this stable path, then upload the fresh one.
  await supabase.storage.from(PDF_BUCKET).remove([storagePath]);
  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) return null;
  return storagePath;
}
