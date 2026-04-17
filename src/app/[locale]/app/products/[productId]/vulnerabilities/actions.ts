"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VulnStatus = "open" | "in_progress" | "resolved" | "accepted";
export type VulnResolutionType =
  | "fix"
  | "mitigation"
  | "false_positive"
  | "wont_fix";
export type VulnSeverity = "critical" | "high" | "medium" | "low";

export interface VulnListItem {
  id: string;
  cve_id: string;
  description: string | null;
  severity: VulnSeverity;
  cvss_score: number | null;
  cisa_kev: boolean;
  actively_exploited: boolean;
  status: VulnStatus;
  discovery_date: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  resolution_type: VulnResolutionType | null;
  component_id: string;
  component_name: string;
  component_version: string | null;
  assignee: VulnUserRef | null;
  resolver: VulnUserRef | null;
}

export interface VulnUserRef {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface TeamMemberOption {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

export interface VulnListFilters {
  statuses?: VulnStatus[];
  severities?: VulnSeverity[];
  assigneeId?: string | "unassigned" | null;
  kevOnly?: boolean;
  activelyExploitedOnly?: boolean;
  search?: string;
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
const ROLES_CAN_FLAG_EXPLOIT = new Set(["admin", "compliance_officer"]);

function canWrite(role: string | null) {
  return !!role && ROLES_CAN_WRITE.has(role);
}
function canFlagExploit(role: string | null) {
  return !!role && ROLES_CAN_FLAG_EXPLOIT.has(role);
}

// Severity rank for consistent ordering (critical first, KEV/exploit bumps).
function severityRank(severity: VulnSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity];
}

// ---------------------------------------------------------------------------
// List vulnerabilities for a product (joined with component + assignee)
// ---------------------------------------------------------------------------

export async function listProductVulnerabilities(
  productId: string,
  filters: VulnListFilters = {},
): Promise<{ vulns: VulnListItem[]; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { vulns: [], error: "notAuthenticated" };

  // Load all SBOM component ids for this product so we only pull their vulns.
  // RLS guarantees org scoping so we don't re-check here.
  const { data: sboms } = await supabase
    .from("sboms")
    .select("id")
    .eq("product_id", productId);
  const sbomIds = (sboms ?? []).map((s) => (s as { id: string }).id);
  if (sbomIds.length === 0) return { vulns: [] };

  const { data: components } = await supabase
    .from("sbom_components")
    .select("id, component_name, component_version")
    .in("sbom_id", sbomIds);
  const componentMap = new Map<
    string,
    { name: string; version: string | null }
  >();
  for (const c of components ?? []) {
    const row = c as {
      id: string;
      component_name: string;
      component_version: string | null;
    };
    componentMap.set(row.id, {
      name: row.component_name,
      version: row.component_version,
    });
  }
  if (componentMap.size === 0) return { vulns: [] };

  let query = supabase
    .from("vulnerabilities")
    .select(
      "id, sbom_component_id, cve_id, description, severity, cvss_score, cisa_kev, discovery_date, status, resolved_at, resolution_notes, resolution_type, assigned_to, resolved_by, actively_exploited",
    )
    .in("sbom_component_id", Array.from(componentMap.keys()));

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }
  if (filters.severities && filters.severities.length > 0) {
    query = query.in("severity", filters.severities);
  }
  if (filters.kevOnly) query = query.eq("cisa_kev", true);
  if (filters.activelyExploitedOnly) query = query.eq("actively_exploited", true);
  if (filters.assigneeId === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (filters.assigneeId) {
    query = query.eq("assigned_to", filters.assigneeId);
  }
  if (filters.search) {
    query = query.ilike("cve_id", `%${filters.search}%`);
  }

  const { data: vulnRows, error } = await query;
  if (error) return { vulns: [], error: "generic" };

  // Load the distinct assignees + resolvers in one round-trip.
  const userIds = new Set<string>();
  for (const v of vulnRows ?? []) {
    const r = v as Record<string, string | null>;
    if (r.assigned_to) userIds.add(r.assigned_to);
    if (r.resolved_by) userIds.add(r.resolved_by);
  }
  const userMap = new Map<string, VulnUserRef>();
  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url")
      .in("id", Array.from(userIds));
    for (const u of users ?? []) {
      const row = u as VulnUserRef;
      userMap.set(row.id, row);
    }
  }

  const vulns: VulnListItem[] = (vulnRows ?? []).map((v) => {
    const r = v as Record<string, unknown>;
    const component = componentMap.get(r.sbom_component_id as string);
    return {
      id: r.id as string,
      cve_id: r.cve_id as string,
      description: (r.description as string | null) ?? null,
      severity: r.severity as VulnSeverity,
      cvss_score: (r.cvss_score as number | null) ?? null,
      cisa_kev: !!r.cisa_kev,
      actively_exploited: !!r.actively_exploited,
      status: (r.status as VulnStatus) ?? "open",
      discovery_date: (r.discovery_date as string | null) ?? null,
      resolved_at: (r.resolved_at as string | null) ?? null,
      resolution_notes: (r.resolution_notes as string | null) ?? null,
      resolution_type:
        (r.resolution_type as VulnResolutionType | null) ?? null,
      component_id: r.sbom_component_id as string,
      component_name: component?.name ?? "",
      component_version: component?.version ?? null,
      assignee: r.assigned_to
        ? userMap.get(r.assigned_to as string) ?? null
        : null,
      resolver: r.resolved_by
        ? userMap.get(r.resolved_by as string) ?? null
        : null,
    };
  });

  // Sort: KEV/actively-exploited first, then by severity, then CVSS desc,
  // then newest discovery date. Gives "do these first" ranking.
  vulns.sort((a, b) => {
    const aBump = (a.actively_exploited ? 0 : 2) + (a.cisa_kev ? 0 : 1);
    const bBump = (b.actively_exploited ? 0 : 2) + (b.cisa_kev ? 0 : 1);
    if (aBump !== bBump) return aBump - bBump;
    const sev = severityRank(a.severity) - severityRank(b.severity);
    if (sev !== 0) return sev;
    const cvss = (b.cvss_score ?? 0) - (a.cvss_score ?? 0);
    if (cvss !== 0) return cvss;
    return (b.discovery_date ?? "").localeCompare(a.discovery_date ?? "");
  });

  return { vulns };
}

// ---------------------------------------------------------------------------
// Load the org team for the assignee picker
// ---------------------------------------------------------------------------

export async function listAssignableMembers(): Promise<{
  members: TeamMemberOption[];
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { members: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, role")
    .eq("org_id", orgId)
    .order("full_name", { ascending: true });
  if (error) return { members: [], error: "generic" };

  // Hide viewers — they can't act on vulns so assigning to them is a dead end.
  const members = (data ?? [])
    .map((u) => u as TeamMemberOption)
    .filter((u) => u.role !== "viewer");
  return { members };
}

// ---------------------------------------------------------------------------
// Update single vulnerability status (+ optional resolution metadata)
// ---------------------------------------------------------------------------

export async function updateVulnerabilityStatus(
  vulnId: string,
  status: VulnStatus,
  options: {
    notes?: string | null;
    resolutionType?: VulnResolutionType | null;
  } = {},
  productId?: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const update: Record<string, unknown> = { status };
  if (status === "resolved" || status === "accepted") {
    update.resolved_at = new Date().toISOString();
    update.resolved_by = user.id;
    update.resolution_notes = options.notes?.trim() || null;
    update.resolution_type = options.resolutionType ?? null;
  } else {
    // reopening: clear resolution metadata
    update.resolved_at = null;
    update.resolved_by = null;
    update.resolution_notes = null;
    update.resolution_type = null;
  }

  const { error } = await supabase
    .from("vulnerabilities")
    .update(update)
    .eq("id", vulnId);
  if (error) return { error: "generic" };

  await logActivity({
    action: `vulnerability.${status}`,
    targetType: "vulnerability",
    targetId: vulnId,
    metadata: options.notes
      ? { resolutionType: options.resolutionType ?? null }
      : undefined,
  });

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return {};
}

// ---------------------------------------------------------------------------
// Bulk status update
// ---------------------------------------------------------------------------

export async function bulkUpdateVulnStatus(
  vulnIds: string[],
  status: VulnStatus,
  options: {
    notes?: string | null;
    resolutionType?: VulnResolutionType | null;
  } = {},
  productId?: string,
): Promise<{ error?: string; updated?: number }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (vulnIds.length === 0) return { updated: 0 };

  const update: Record<string, unknown> = { status };
  if (status === "resolved" || status === "accepted") {
    update.resolved_at = new Date().toISOString();
    update.resolved_by = user.id;
    update.resolution_notes = options.notes?.trim() || null;
    update.resolution_type = options.resolutionType ?? null;
  } else {
    update.resolved_at = null;
    update.resolved_by = null;
    update.resolution_notes = null;
    update.resolution_type = null;
  }

  const { error } = await supabase
    .from("vulnerabilities")
    .update(update)
    .in("id", vulnIds);
  if (error) return { error: "generic" };

  // One activity row per vuln keeps the timeline accurate without a bulk event.
  for (const id of vulnIds) {
    await logActivity({
      action: `vulnerability.${status}`,
      targetType: "vulnerability",
      targetId: id,
    });
  }

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return { updated: vulnIds.length };
}

// ---------------------------------------------------------------------------
// Assign / unassign
// ---------------------------------------------------------------------------

export async function assignVulnerability(
  vulnId: string,
  userId: string | null,
  productId?: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("vulnerabilities")
    .update({ assigned_to: userId })
    .eq("id", vulnId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "vulnerability.assigned",
    targetType: "vulnerability",
    targetId: vulnId,
    metadata: { assigneeId: userId },
  });

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return {};
}

export async function bulkAssignVulnerabilities(
  vulnIds: string[],
  userId: string | null,
  productId?: string,
): Promise<{ error?: string; updated?: number }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (vulnIds.length === 0) return { updated: 0 };

  const { error } = await supabase
    .from("vulnerabilities")
    .update({ assigned_to: userId })
    .in("id", vulnIds);
  if (error) return { error: "generic" };

  for (const id of vulnIds) {
    await logActivity({
      action: "vulnerability.assigned",
      targetType: "vulnerability",
      targetId: id,
      metadata: { assigneeId: userId },
    });
  }

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return { updated: vulnIds.length };
}

// ---------------------------------------------------------------------------
// Mark actively exploited (gated — only admin + compliance_officer)
// Flipping this flag is what escalates a vuln into an Article 14 incident
// once Phase 2 lands.
// ---------------------------------------------------------------------------

export async function setActivelyExploited(
  vulnId: string,
  flag: boolean,
  productId?: string,
): Promise<{ error?: string; incidentId?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canFlagExploit(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("vulnerabilities")
    .update({
      actively_exploited: flag,
      actively_exploited_at: flag ? new Date().toISOString() : null,
    })
    .eq("id", vulnId);
  if (error) return { error: "generic" };

  await logActivity({
    action: flag
      ? "vulnerability.marked_exploited"
      : "vulnerability.unmarked_exploited",
    targetType: "vulnerability",
    targetId: vulnId,
  });

  // Flipping to true kicks off the Article 14 clock. Auto-create a linked
  // incident record so the team sees the 24h/72h/14d countdown straight
  // away instead of having to remember to file one manually.
  let newIncidentId: string | undefined;
  if (flag) {
    const { data: existing } = await supabase
      .from("incidents")
      .select("id")
      .eq("linked_vulnerability_id", vulnId)
      .eq("org_id", orgId)
      .limit(1);
    const alreadyLinked = !!(existing && existing.length > 0);

    if (!alreadyLinked) {
      const { data: vulnRow } = await supabase
        .from("vulnerabilities")
        .select("cve_id, severity, description, sbom_component_id")
        .eq("id", vulnId)
        .single();
      const vr = vulnRow as {
        cve_id: string;
        severity: string;
        description: string | null;
        sbom_component_id: string;
      } | null;

      let affectedProducts: string[] = [];
      if (productId) {
        affectedProducts = [productId];
      } else if (vr) {
        const { data: comp } = await supabase
          .from("sbom_components")
          .select("sbom_id")
          .eq("id", vr.sbom_component_id)
          .single();
        const cr = comp as { sbom_id: string } | null;
        if (cr) {
          const { data: sbom } = await supabase
            .from("sboms")
            .select("product_id")
            .eq("id", cr.sbom_id)
            .single();
          const sr = sbom as { product_id: string } | null;
          if (sr) affectedProducts = [sr.product_id];
        }
      }

      const { data: incident } = await supabase
        .from("incidents")
        .insert({
          org_id: orgId,
          type: "exploited_vulnerability",
          severity: (vr?.severity as string) ?? "high",
          title: `${vr?.cve_id ?? "Exploited vulnerability"} actively exploited`,
          description: vr?.description ?? null,
          affected_product_ids: affectedProducts,
          linked_vulnerability_id: vulnId,
          linked_cve_id: vr?.cve_id ?? null,
          status: "detected",
          created_by: user.id,
        })
        .select("id")
        .single();

      const ir = incident as { id: string } | null;
      if (ir) {
        newIncidentId = ir.id;
        await logActivity({
          action: "incident.detected",
          targetType: "incident",
          targetId: ir.id,
          targetName: `${vr?.cve_id ?? "exploited"} actively exploited`,
          metadata: {
            type: "exploited_vulnerability",
            source: "vulnerability_flag",
            vulnerabilityId: vulnId,
          },
        });
        revalidatePath("/app/incidents");
        revalidatePath("/app/dashboard");
      }
    }
  }

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return { incidentId: newIncidentId };
}

// ---------------------------------------------------------------------------
// Update resolution note without changing status
// ---------------------------------------------------------------------------

export async function updateVulnerabilityNote(
  vulnId: string,
  notes: string,
  productId?: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("vulnerabilities")
    .update({ resolution_notes: notes.trim() || null })
    .eq("id", vulnId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "vulnerability.note_added",
    targetType: "vulnerability",
    targetId: vulnId,
  });

  if (productId) {
    revalidatePath(`/app/products/${productId}/vulnerabilities`);
  }
  return {};
}
