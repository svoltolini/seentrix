"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

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
}

// ---------------------------------------------------------------------------
// Helpers
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
  const nameMap = await loadProductNames(row.affected_product_ids ?? []);
  return {
    incident: {
      ...row,
      affected_product_ids: row.affected_product_ids ?? [],
      affected_product_names: (row.affected_product_ids ?? [])
        .map((pid) => nameMap[pid])
        .filter(Boolean),
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
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
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
      "id, aware_at, status, early_warning_submitted_at, incident_report_submitted_at, final_report_submitted_at",
    )
    .eq("org_id", orgId)
    .not("status", "eq", "closed");

  const rows = (data ?? []) as {
    id: string;
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
    const base = new Date(r.aware_at).getTime();
    const deadlines: { phase: IncidentPhase; at: number; done: boolean }[] = [
      {
        phase: "early_warning",
        at: base + 24 * 3600 * 1000,
        done: !!r.early_warning_submitted_at,
      },
      {
        phase: "incident_report",
        at: base + 72 * 3600 * 1000,
        done: !!r.incident_report_submitted_at,
      },
      {
        phase: "final_report",
        at: base + 14 * 24 * 3600 * 1000,
        done: !!r.final_report_submitted_at,
      },
    ];
    for (const d of deadlines) {
      if (d.done) continue;
      if (nextAt === null || d.at < nextAt) {
        nextAt = d.at;
        nextPhase = d.phase;
        nextId = r.id;
      }
    }
  }

  return {
    activeCount: rows.length,
    nextDeadlineAt: nextAt ? new Date(nextAt).toISOString() : null,
    nextDeadlinePhase: nextPhase,
    nextIncidentId: nextId,
  };
}
