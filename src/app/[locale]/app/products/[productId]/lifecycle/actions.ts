"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import {
  isSupplyRelation,
  isMonitoringSource,
  isMonitoringSeverity,
  isAdvisorySeverity,
  isTestType,
} from "./constants";

const PDF_BUCKET = "document-pdfs";

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export interface SupplyEntry {
  id: string;
  relation: string;
  entity_type: string | null;
  name: string;
  address: string | null;
  contact: string | null;
  notes: string | null;
}
export interface MonitoringEntry {
  id: string;
  entry_date: string;
  source: string;
  severity: string | null;
  description: string;
  link: string | null;
}
export interface Advisory {
  id: string;
  advisory_ref: string | null;
  cve_id: string | null;
  title: string;
  summary: string | null;
  affected_versions: string | null;
  fixed_version: string | null;
  severity: string | null;
  published_at: string | null;
  is_public: boolean;
}
export interface SecurityTest {
  id: string;
  test_type: string;
  frequency_days: number | null;
  last_performed_at: string | null;
  next_due: string | null;
  result: string | null;
  notes: string | null;
}

export interface LifecycleState {
  productName: string;
  canWrite: boolean;
  conformity: {
    route: string | null;
    nbName: string | null;
    nbId: string | null;
    nbScope: string | null;
    surveillanceNotes: string;
  };
  supportPeriodEnd: string | null;
  eosNotice: string;
  eosNotifiedAt: string | null;
  correctiveActionProcedure: string;
  suppliers: SupplyEntry[];
  monitoring: MonitoringEntry[];
  advisories: Advisory[];
  tests: SecurityTest[];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const user = await getAuthUser();
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

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadLifecycle(
  productId: string,
): Promise<{ state: LifecycleState | null; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const { data: product } = await supabase
    .from("products")
    .select(
      "name, conformity_route, notified_body_name, notified_body_id, notified_body_scope, notified_body_surveillance_notes, support_period_end, eos_notice, eos_notified_at, corrective_action_procedure",
    )
    .eq("id", productId)
    .single();
  if (!product) return { state: null, error: "notFound" };
  const p = product as Record<string, string | null>;

  const [{ data: suppliers }, { data: monitoring }, { data: advisories }, { data: tests }] =
    await Promise.all([
      supabase
        .from("supply_chain_entries")
        .select("id, relation, entity_type, name, address, contact, notes")
        .eq("product_id", productId)
        .order("created_at", { ascending: true }),
      supabase
        .from("monitoring_entries")
        .select("id, entry_date, source, severity, description, link")
        .eq("product_id", productId)
        .order("entry_date", { ascending: false }),
      supabase
        .from("vulnerability_advisories")
        .select(
          "id, advisory_ref, cve_id, title, summary, affected_versions, fixed_version, severity, published_at, is_public",
        )
        .eq("product_id", productId)
        .order("published_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("security_tests")
        .select("id, test_type, frequency_days, last_performed_at, next_due, result, notes")
        .eq("product_id", productId)
        .order("next_due", { ascending: true, nullsFirst: false }),
    ]);

  return {
    state: {
      productName: (p.name as string) ?? "",
      canWrite: canWrite(role),
      conformity: {
        route: p.conformity_route,
        nbName: p.notified_body_name,
        nbId: p.notified_body_id,
        nbScope: p.notified_body_scope,
        surveillanceNotes: p.notified_body_surveillance_notes ?? "",
      },
      supportPeriodEnd: p.support_period_end,
      eosNotice: p.eos_notice ?? "",
      eosNotifiedAt: p.eos_notified_at,
      correctiveActionProcedure: p.corrective_action_procedure ?? "",
      suppliers: (suppliers as SupplyEntry[] | null) ?? [],
      monitoring: (monitoring as MonitoringEntry[] | null) ?? [],
      advisories: (advisories as Advisory[] | null) ?? [],
      tests: (tests as SecurityTest[] | null) ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Product-level fields (surveillance, corrective action, EoS notice)
// ---------------------------------------------------------------------------

export async function saveLifecycleFields(
  productId: string,
  fields: {
    surveillanceNotes: string;
    correctiveActionProcedure: string;
    eosNotice: string;
  },
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const { error } = await supabase
    .from("products")
    .update({
      notified_body_surveillance_notes: fields.surveillanceNotes || null,
      corrective_action_procedure: fields.correctiveActionProcedure || null,
      eos_notice: fields.eosNotice || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) return { error: "generic" };
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export async function markEosNotified(
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const { error } = await supabase
    .from("products")
    .update({ eos_notified_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: "generic" };
  await logActivity({
    action: "lifecycle.eos_notified",
    targetType: "product",
    targetId: productId,
  });
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

// ---------------------------------------------------------------------------
// Register CRUD — generic insert/delete keyed by table
// ---------------------------------------------------------------------------

async function deleteRow(
  table: string,
  productId: string,
  id: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: "generic" };
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export async function deleteSupplier(productId: string, id: string) {
  return deleteRow("supply_chain_entries", productId, id);
}
export async function deleteMonitoringEntry(productId: string, id: string) {
  return deleteRow("monitoring_entries", productId, id);
}
export async function deleteAdvisory(productId: string, id: string) {
  return deleteRow("vulnerability_advisories", productId, id);
}
export async function deleteSecurityTest(productId: string, id: string) {
  return deleteRow("security_tests", productId, id);
}

export interface SupplyInput {
  relation: string;
  entity_type: string;
  name: string;
  address: string;
  contact: string;
  notes: string;
}
export async function addSupplier(
  productId: string,
  input: SupplyInput,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (!input.name.trim()) return { error: "nameRequired" };
  if (!isSupplyRelation(input.relation)) return { error: "invalid" };
  const { error } = await supabase.from("supply_chain_entries").insert({
    product_id: productId,
    org_id: orgId,
    relation: input.relation,
    entity_type: input.entity_type || null,
    name: input.name.trim(),
    address: input.address || null,
    contact: input.contact || null,
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) return { error: "generic" };
  await logActivity({ action: "supply_chain.entry_added", targetType: "product", targetId: productId });
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export interface MonitoringInput {
  entry_date: string;
  source: string;
  severity: string;
  description: string;
  link: string;
}
export async function addMonitoringEntry(
  productId: string,
  input: MonitoringInput,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (!input.description.trim()) return { error: "descriptionRequired" };
  if (!isMonitoringSource(input.source)) return { error: "invalid" };
  const { error } = await supabase.from("monitoring_entries").insert({
    product_id: productId,
    org_id: orgId,
    entry_date: input.entry_date || new Date().toISOString().slice(0, 10),
    source: input.source,
    severity: isMonitoringSeverity(input.severity) ? input.severity : null,
    description: input.description.trim(),
    link: input.link || null,
    created_by: user.id,
  });
  if (error) return { error: "generic" };
  await logActivity({ action: "monitoring.entry_added", targetType: "product", targetId: productId });
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export interface AdvisoryInput {
  advisory_ref: string;
  cve_id: string;
  title: string;
  summary: string;
  affected_versions: string;
  fixed_version: string;
  severity: string;
  published_at: string;
  is_public: boolean;
}
export async function addAdvisory(
  productId: string,
  input: AdvisoryInput,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (!input.title.trim()) return { error: "titleRequired" };
  const { error } = await supabase.from("vulnerability_advisories").insert({
    product_id: productId,
    org_id: orgId,
    advisory_ref: input.advisory_ref || null,
    cve_id: input.cve_id || null,
    title: input.title.trim(),
    summary: input.summary || null,
    affected_versions: input.affected_versions || null,
    fixed_version: input.fixed_version || null,
    severity: isAdvisorySeverity(input.severity) ? input.severity : null,
    published_at: input.published_at || null,
    is_public: !!input.is_public,
    created_by: user.id,
  });
  if (error) return { error: "generic" };
  await logActivity({ action: "advisory.created", targetType: "product", targetId: productId });
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export async function toggleAdvisoryPublic(
  productId: string,
  id: string,
  isPublic: boolean,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const { error } = await supabase
    .from("vulnerability_advisories")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "generic" };
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

export interface TestInput {
  test_type: string;
  frequency_days: string;
  last_performed_at: string;
  next_due: string;
  result: string;
  notes: string;
}
export async function addSecurityTest(
  productId: string,
  input: TestInput,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (!isTestType(input.test_type)) return { error: "invalid" };
  const freq = parseInt(input.frequency_days, 10);
  // Derive next_due from last_performed + frequency when not given explicitly.
  let nextDueVal = input.next_due || null;
  if (!nextDueVal && input.last_performed_at && Number.isFinite(freq) && freq > 0) {
    nextDueVal = new Date(
      new Date(input.last_performed_at).getTime() + freq * 86_400_000,
    )
      .toISOString()
      .slice(0, 10);
  }
  const { error } = await supabase.from("security_tests").insert({
    product_id: productId,
    org_id: orgId,
    test_type: input.test_type,
    frequency_days: Number.isFinite(freq) && freq > 0 ? freq : null,
    last_performed_at: input.last_performed_at || null,
    next_due: nextDueVal,
    result: input.result || null,
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) return { error: "generic" };
  await logActivity({ action: "security_test.scheduled", targetType: "product", targetId: productId });
  revalidatePath(`/app/products/${productId}/lifecycle`);
  return {};
}

// ---------------------------------------------------------------------------
// Export the lifecycle register as a single PDF
// ---------------------------------------------------------------------------

export async function exportLifecycleRegister(
  productId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  // Plan gate: PDF export is a paid feature.
  {
    const { canGeneratePdf } = await import("@/lib/constants/plans");
    const { getOrgPlan } = await import("@/lib/entitlements");
    if (!canGeneratePdf(await getOrgPlan(supabase, orgId)))
      return { error: "planRequired" };
  }

  const { state } = await loadLifecycle(productId);
  if (!state) return { error: "notFound" };

  const { getLocale, getTranslations } = await import("next-intl/server");
  const { isLocale } = await import("@/i18n/locales");
  const { generateLifecycleRegisterPdf } = await import(
    "@/lib/pdf/generate-lifecycle-register"
  );
  const resolved = await getLocale();
  const locale = isLocale(resolved) ? resolved : "en";
  const t = await getTranslations({ locale, namespace: "lifecycle" });

  const messages: Record<string, string> = {
    title: t("pdf.title"),
    conformity: t("sections.conformity"),
    route: t("conformity.route"),
    notifiedBody: t("conformity.notifiedBody"),
    surveillance: t("conformity.surveillance"),
    supplyChain: t("sections.supplyChain"),
    monitoring: t("sections.monitoring"),
    advisories: t("sections.advisories"),
    securityTests: t("sections.securityTests"),
    endOfSupport: t("sections.endOfSupport"),
    supportEnd: t("eos.supportEnd"),
    eosNotice: t("eos.notice"),
    correctiveAction: t("eos.corrective"),
    upstream: t("supply.upstream"),
    downstream: t("supply.downstream"),
    none: t("pdf.none"),
    retentionNote: t("supply.retention"),
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(locale === "en" ? "en-US" : `${locale}-${locale.toUpperCase()}`) : "";

  const data = {
    productName: state.productName,
    conformity: {
      route: state.conformity.route ? t(`routes.${state.conformity.route}`) : "—",
      notifiedBody: [state.conformity.nbName, state.conformity.nbId]
        .filter(Boolean)
        .join(" · "),
      surveillance: state.conformity.surveillanceNotes,
    },
    suppliers: state.suppliers.map((s) => ({
      relation: t(`supply.${s.relation === "upstream_supplier" ? "upstream" : "downstream"}`),
      name: s.name,
      address: s.address ?? "",
      contact: s.contact ?? "",
    })),
    monitoring: state.monitoring.map((m) => ({
      date: fmt(m.entry_date),
      source: t(`sources.${m.source}`),
      severity: m.severity ?? "",
      description: m.description,
    })),
    advisories: state.advisories.map((a) => ({
      ref: a.advisory_ref || a.cve_id || "",
      title: a.title,
      fixed: a.fixed_version ?? "",
      published: fmt(a.published_at),
    })),
    tests: state.tests.map((te) => ({
      type: t(`testTypes.${te.test_type}`),
      last: fmt(te.last_performed_at),
      next: fmt(te.next_due),
      result: te.result ?? "",
    })),
    supportEnd: fmt(state.supportPeriodEnd),
    eosNotice: state.eosNotice,
    correctiveAction: state.correctiveActionProcedure,
  };

  const generatedAt = new Date().toLocaleDateString(
    locale === "en" ? "en-US" : `${locale}-${locale.toUpperCase()}`,
    { year: "numeric", month: "long", day: "numeric" },
  );
  const buffer = await generateLifecycleRegisterPdf({ data, messages, generatedAt });

  const storagePath = `${orgId}/${productId}/lifecycle-register.pdf`;
  await supabase.storage.from(PDF_BUCKET).remove([storagePath]);
  const { error: uploadError } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) return { error: "generic" };
  const { data: signed } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (!signed?.signedUrl) return { error: "generic" };
  await logActivity({ action: "lifecycle.register_exported", targetType: "product", targetId: productId });
  return { url: signed.signedUrl };
}
