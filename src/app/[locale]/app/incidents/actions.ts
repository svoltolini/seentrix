"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import {
  nextPhaseDeadline,
  phaseDeadline,
} from "@/lib/constants/incident-deadlines";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IncidentType = "security_incident" | "exploited_vulnerability";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus =
  | "detected"
  | "early_warning_submitted"
  | "incident_report_submitted"
  | "final_report_submitted"
  | "closed";

export type IncidentPhase =
  | "early_warning"
  | "incident_report"
  | "final_report";

export interface IncidentSubmissionRow {
  stage: IncidentPhase;
  reference_no: string | null;
  submitted_at: string;
}

export interface IncidentSummary {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  status: IncidentStatus;
  aware_at: string;
  early_warning_submitted_at: string | null;
  incident_report_submitted_at: string | null;
  final_report_submitted_at: string | null;
  affected_product_ids: string[];
  linked_cve_id: string | null;
  created_at: string;
  // Derived on the server for the list view.
  affected_product_names: string[];
}

export interface IncidentDetail extends IncidentSummary {
  description: string | null;
  linked_vulnerability_id: string | null;
  early_warning_notes: string | null;
  incident_report_notes: string | null;
  final_report_notes: string | null;
  user_notification_sent_at: string | null;
  user_notification_content: string | null;
  closed_at: string | null;
  created_by: string | null;
  updated_at: string;
  submissions: IncidentSubmissionRow[];
}

// ---------------------------------------------------------------------------
// Helpers
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

const ROLES_CAN_WRITE = new Set([
  "admin",
  "compliance_officer",
  "cto",
  "editor",
]);
const ROLES_CAN_SUBMIT = new Set(["admin", "compliance_officer"]);
function canWrite(role: string | null) {
  return !!role && ROLES_CAN_WRITE.has(role);
}
function canSubmit(role: string | null) {
  return !!role && ROLES_CAN_SUBMIT.has(role);
}

async function loadProductNames(
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name")
    .in("id", ids);
  const map: Record<string, string> = {};
  for (const p of data ?? []) {
    const row = p as { id: string; name: string };
    map[row.id] = row.name;
  }
  return map;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listIncidents(): Promise<{
  incidents: IncidentSummary[];
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { incidents: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("incidents")
    .select(
      "id, type, severity, title, status, aware_at, early_warning_submitted_at, incident_report_submitted_at, final_report_submitted_at, affected_product_ids, linked_cve_id, created_at",
    )
    .eq("org_id", orgId)
    .order("aware_at", { ascending: false });
  if (error) return { incidents: [], error: "generic" };

  const allProductIds = new Set<string>();
  for (const i of data ?? []) {
    const row = i as { affected_product_ids: string[] | null };
    for (const id of row.affected_product_ids ?? []) allProductIds.add(id);
  }
  const nameMap = await loadProductNames(Array.from(allProductIds));

  const incidents: IncidentSummary[] = (data ?? []).map((r) => {
    const row = r as unknown as IncidentSummary;
    return {
      ...row,
      affected_product_ids: row.affected_product_ids ?? [],
      affected_product_names: (row.affected_product_ids ?? [])
        .map((id) => nameMap[id])
        .filter(Boolean),
    };
  });
  return { incidents };
}

// ---------------------------------------------------------------------------
// Single incident
// ---------------------------------------------------------------------------

export async function getIncident(
  id: string,
): Promise<{ incident: IncidentDetail | null; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { incident: null, error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();
  if (error || !data) return { incident: null, error: "notFound" };

  const row = data as unknown as IncidentDetail;
  const [nameMap, { data: subs }] = await Promise.all([
    loadProductNames(row.affected_product_ids ?? []),
    supabase
      .from("incident_submissions")
      .select("stage, reference_no, submitted_at")
      .eq("incident_id", id),
  ]);
  return {
    incident: {
      ...row,
      affected_product_ids: row.affected_product_ids ?? [],
      affected_product_names: (row.affected_product_ids ?? [])
        .map((pid) => nameMap[pid])
        .filter(Boolean),
      submissions: (subs as IncidentSubmissionRow[] | null) ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Create (manual or auto-triggered by actively-exploited vuln)
// ---------------------------------------------------------------------------

export interface CreateIncidentInput {
  type: IncidentType;
  severity?: IncidentSeverity;
  title: string;
  description?: string;
  affected_product_ids?: string[];
  linked_vulnerability_id?: string | null;
  linked_cve_id?: string | null;
  aware_at?: string;
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<{ id?: string; error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      org_id: orgId,
      type: input.type,
      severity: input.severity ?? "high",
      title: input.title,
      description: input.description ?? null,
      affected_product_ids: input.affected_product_ids ?? [],
      linked_vulnerability_id: input.linked_vulnerability_id ?? null,
      linked_cve_id: input.linked_cve_id ?? null,
      aware_at: input.aware_at ?? new Date().toISOString(),
      status: "detected",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "generic" };

  const row = data as { id: string };
  await logActivity({
    action: "incident.detected",
    targetType: "incident",
    targetId: row.id,
    targetName: input.title,
    metadata: { type: input.type, severity: input.severity ?? "high" },
  });
  revalidatePath("/app/incidents");
  revalidatePath("/app/dashboard");
  return { id: row.id };
}

// ---------------------------------------------------------------------------
// Update narrative fields (title, description, severity, affected products,
// and any of the three phase note blocks before submission).
// ---------------------------------------------------------------------------

export interface UpdateIncidentInput {
  title?: string;
  description?: string | null;
  severity?: IncidentSeverity;
  affected_product_ids?: string[];
  early_warning_notes?: string | null;
  incident_report_notes?: string | null;
  final_report_notes?: string | null;
  user_notification_content?: string | null;
}

export async function updateIncident(
  id: string,
  patch: UpdateIncidentInput,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("incidents")
    .update(patch)
    .eq("id", id);
  if (error) return { error: "generic" };

  await logActivity({
    action: "incident.updated",
    targetType: "incident",
    targetId: id,
  });
  revalidatePath(`/app/incidents/${id}`);
  return {};
}

// ---------------------------------------------------------------------------
// Submit one of the three phases
// ---------------------------------------------------------------------------

export async function submitIncidentPhase(
  id: string,
  phase: IncidentPhase,
  notes: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canSubmit(role)) return { error: "notAuthorized" };
  if (!notes.trim()) return { error: "notesRequired" };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};
  let newStatus: IncidentStatus;
  let action: string;
  switch (phase) {
    case "early_warning":
      update.early_warning_notes = notes.trim();
      update.early_warning_submitted_at = now;
      newStatus = "early_warning_submitted";
      action = "incident.early_warning_submitted";
      break;
    case "incident_report":
      update.incident_report_notes = notes.trim();
      update.incident_report_submitted_at = now;
      newStatus = "incident_report_submitted";
      action = "incident.incident_report_submitted";
      break;
    case "final_report":
      update.final_report_notes = notes.trim();
      update.final_report_submitted_at = now;
      newStatus = "final_report_submitted";
      action = "incident.final_report_submitted";
      break;
  }
  update.status = newStatus;

  const { error } = await supabase
    .from("incidents")
    .update(update)
    .eq("id", id);
  if (error) return { error: "generic" };

  // Record the per-stage submission (snapshot of the content sent). One row per
  // (incident, stage); re-submitting updates it in place.
  await supabase.from("incident_submissions").upsert(
    {
      incident_id: id,
      org_id: orgId,
      stage: phase,
      content: { notes: notes.trim() },
      submitted_at: now,
      submitted_by: user.id,
    },
    { onConflict: "incident_id,stage" },
  );

  await logActivity({
    action,
    targetType: "incident",
    targetId: id,
    metadata: { phase },
  });
  revalidatePath(`/app/incidents/${id}`);
  revalidatePath("/app/incidents");
  revalidatePath("/app/dashboard");
  return {};
}

// ---------------------------------------------------------------------------
// Record user notification (Article 14 obliges notifying affected users of
// available mitigations).
// ---------------------------------------------------------------------------

export async function recordUserNotification(
  id: string,
  content: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canSubmit(role)) return { error: "notAuthorized" };
  if (!content.trim()) return { error: "contentRequired" };

  const { error } = await supabase
    .from("incidents")
    .update({
      user_notification_content: content.trim(),
      user_notification_sent_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "generic" };

  await logActivity({
    action: "incident.user_notified",
    targetType: "incident",
    targetId: id,
  });
  revalidatePath(`/app/incidents/${id}`);
  return {};
}

// ---------------------------------------------------------------------------
// Close incident
// ---------------------------------------------------------------------------

export async function closeIncident(id: string): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canSubmit(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("incidents")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "generic" };

  await logActivity({
    action: "incident.closed",
    targetType: "incident",
    targetId: id,
  });
  revalidatePath(`/app/incidents/${id}`);
  revalidatePath("/app/incidents");
  revalidatePath("/app/dashboard");
  return {};
}

// ---------------------------------------------------------------------------
// Load products for the composer's "affected products" picker
// ---------------------------------------------------------------------------

export async function listOrgProducts(): Promise<{
  products: { id: string; name: string }[];
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { products: [], error: "notAuthenticated" };
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  if (error) return { products: [], error: "generic" };
  return {
    products: (data ?? []).map((p) => p as { id: string; name: string }),
  };
}

// ---------------------------------------------------------------------------
// Dashboard widget query — count active incidents + earliest deadline
// ---------------------------------------------------------------------------

export interface IncidentWidgetData {
  activeCount: number;
  nextDeadlineAt: string | null;
  nextDeadlinePhase: IncidentPhase | null;
  nextIncidentId: string | null;
}

export async function getIncidentWidget(): Promise<IncidentWidgetData> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return {
      activeCount: 0,
      nextDeadlineAt: null,
      nextDeadlinePhase: null,
      nextIncidentId: null,
    };
  }
  const { data } = await supabase
    .from("incidents")
    .select(
      "id, type, aware_at, status, early_warning_submitted_at, incident_report_submitted_at, final_report_submitted_at",
    )
    .eq("org_id", orgId)
    .not("status", "eq", "closed");

  const rows = (data ?? []) as {
    id: string;
    type: IncidentType;
    aware_at: string;
    status: IncidentStatus;
    early_warning_submitted_at: string | null;
    incident_report_submitted_at: string | null;
    final_report_submitted_at: string | null;
  }[];

  let nextAt: number | null = null;
  let nextPhase: IncidentPhase | null = null;
  let nextId: string | null = null;
  for (const r of rows) {
    const next = nextPhaseDeadline({
      awareAt: r.aware_at,
      type: r.type,
      earlySubmitted: !!r.early_warning_submitted_at,
      notificationSubmitted: !!r.incident_report_submitted_at,
      finalSubmitted: !!r.final_report_submitted_at,
    });
    if (!next) continue;
    const at = next.at.getTime();
    if (nextAt === null || at < nextAt) {
      nextAt = at;
      nextPhase = next.phase;
      nextId = r.id;
    }
  }

  return {
    activeCount: rows.length,
    nextDeadlineAt: nextAt ? new Date(nextAt).toISOString() : null,
    nextDeadlinePhase: nextPhase,
    nextIncidentId: nextId,
  };
}

// ---------------------------------------------------------------------------
// ENISA Single Reporting Platform — record the reference number returned by the
// SRP for a submitted stage, and export a structured submission package PDF.
// ---------------------------------------------------------------------------

export async function recordSubmissionReference(
  incidentId: string,
  stage: IncidentPhase,
  referenceNo: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canSubmit(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("incident_submissions")
    .update({ reference_no: referenceNo.trim() || null })
    .eq("incident_id", incidentId)
    .eq("stage", stage);
  if (error) return { error: "generic" };

  await logActivity({
    action: "incident.srp_reference_recorded",
    targetType: "incident",
    targetId: incidentId,
    metadata: { stage },
  });
  revalidatePath(`/app/incidents/${incidentId}`);
  return {};
}

export async function generateSrpPackage(
  incidentId: string,
  stage: IncidentPhase,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("org_id", orgId)
    .single();
  if (!incident) return { error: "notFound" };
  const inc = incident as Record<string, unknown>;

  const [{ data: org }, names] = await Promise.all([
    supabase
      .from("organizations")
      .select("legal_name, name, security_contact_email, contact_email")
      .eq("id", orgId)
      .maybeSingle(),
    loadProductNames((inc.affected_product_ids as string[] | null) ?? []),
  ]);
  const o = (org as Record<string, string | null>) ?? {};

  const { getLocale, getTranslations } = await import("next-intl/server");
  const { isLocale } = await import("@/i18n/locales");
  const { generateIncidentSubmissionPdf } = await import(
    "@/lib/pdf/generate-incident-submission"
  );
  const resolved = await getLocale();
  const locale = isLocale(resolved) ? resolved : "en";
  const t = await getTranslations({ locale, namespace: "incidents" });

  const type = inc.type as IncidentType;
  const awareAt = inc.aware_at as string;
  const narrativeByStage: Record<IncidentPhase, string> = {
    early_warning: (inc.early_warning_notes as string) ?? "",
    incident_report: (inc.incident_report_notes as string) ?? "",
    final_report: (inc.final_report_notes as string) ?? "",
  };
  const dateLocaleTag: Record<string, string> = {
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    it: "it-IT",
  };
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(dateLocaleTag[locale] ?? "en-US");

  const data = {
    stageLabel: t(`phase.${stage}`),
    reportType: t(`type.${type}`),
    severity: t(`severity.${inc.severity as string}`),
    incidentTitle: (inc.title as string) ?? "",
    organisation: o.legal_name || o.name || "",
    contact: o.security_contact_email || o.contact_email || "",
    awareAt: fmt(awareAt),
    deadline: fmt(phaseDeadline(awareAt, stage, type).toISOString()),
    affectedProducts:
      ((inc.affected_product_ids as string[] | null) ?? [])
        .map((id) => names[id])
        .filter(Boolean)
        .join(", ") || "—",
    cve: (inc.linked_cve_id as string) ?? "—",
    description: (inc.description as string) ?? "",
    narrative: narrativeByStage[stage],
    userNotification: (inc.user_notification_content as string) ?? "",
  };

  const messages: Record<string, string> = {
    title: t("srp.pdf.title"),
    deadlineLabel: t("srp.pdf.deadline"),
    identification: t("srp.pdf.identification"),
    organisation: t("srp.pdf.organisation"),
    contact: t("srp.pdf.contact"),
    reportType: t("srp.pdf.reportType"),
    severity: t("srp.pdf.severity"),
    awareAt: t("srp.pdf.awareAt"),
    affectedProducts: t("srp.pdf.affectedProducts"),
    cve: t("srp.pdf.cve"),
    summary: t("srp.pdf.summary"),
    description: t("srp.pdf.description"),
    stageLabel: t("srp.pdf.stage"),
    userNotification: t("srp.pdf.userNotification"),
  };

  const generatedAt = new Date().toLocaleDateString(
    dateLocaleTag[locale] ?? "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const buffer = await generateIncidentSubmissionPdf({
    data,
    messages,
    generatedAt,
  });
  const storagePath = `${orgId}/incidents/${incidentId}/srp_${stage}.pdf`;
  await supabase.storage.from("document-pdfs").remove([storagePath]);
  const { error: uploadError } = await supabase.storage
    .from("document-pdfs")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) return { error: "generic" };
  const { data: signed } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(storagePath, 3600);
  if (!signed?.signedUrl) return { error: "generic" };

  await logActivity({
    action: "incident.srp_package_generated",
    targetType: "incident",
    targetId: incidentId,
    metadata: { stage },
  });
  return { url: signed.signedUrl };
}
