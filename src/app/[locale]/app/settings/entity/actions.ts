"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export type EntityType =
  | "manufacturer"
  | "authorised_representative"
  | "importer"
  | "distributor"
  | "open_source_software_steward";

export type ObligationStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "not_applicable";

export interface Obligation {
  key: string;
  status: ObligationStatus;
  notes: string | null;
  completed_at: string | null;
}

export interface EntityState {
  entityType: EntityType;
  obligations: Obligation[];
}

// Obligation keys per role (translated copy lives in i18n under
// `entity.obligation.<entity>.<key>.title|description`).
const OBLIGATIONS: Record<EntityType, string[]> = {
  manufacturer: [
    "essential_requirements_met",
    "vulnerability_handling_operational",
    "technical_documentation_ready",
    "doc_issued",
    "ce_marking_affixed",
    "ten_year_records_retained",
  ],
  authorised_representative: [
    "written_mandate",
    "technical_documentation_on_hand",
    "doc_on_hand",
    "cooperate_with_authorities",
    "terminate_if_noncompliant",
  ],
  importer: [
    "verify_manufacturer_doc",
    "verify_ce_marking",
    "verify_technical_documentation",
    "add_importer_details_to_product",
    "store_transport_without_impact",
    "report_exploited_vulnerabilities_to_manufacturer",
    "cooperate_with_authorities",
  ],
  distributor: [
    "verify_ce_marking",
    "verify_importer_details",
    "verify_instructions_user_info",
    "store_transport_without_impact",
    "report_exploited_vulnerabilities",
    "cooperate_with_authorities",
  ],
  open_source_software_steward: [
    "cybersecurity_policy_documented",
    "vulnerability_disclosure_supported",
    "report_under_article_14",
    "cooperate_with_authorities",
  ],
};

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

function canEdit(role: string | null) {
  return role === "admin" || role === "compliance_officer";
}

export async function loadEntityState(): Promise<{
  state: EntityState | null;
  error?: string;
}> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const { data: org } = await supabase
    .from("organizations")
    .select("entity_type")
    .eq("id", orgId)
    .single();
  if (!org) return { state: null, error: "notFound" };
  const entityType = (org as { entity_type: EntityType }).entity_type;

  const expected = OBLIGATIONS[entityType] ?? [];
  const { data: existing } = await supabase
    .from("entity_obligations")
    .select("obligation_key, status, notes, completed_at")
    .eq("org_id", orgId);
  const have = new Set(
    (existing ?? []).map(
      (r) => (r as { obligation_key: string }).obligation_key,
    ),
  );
  const missing = expected.filter((k) => !have.has(k));
  if (missing.length > 0) {
    await supabase.from("entity_obligations").insert(
      missing.map((k) => ({
        org_id: orgId,
        obligation_key: k,
        status: "pending",
      })),
    );
  }

  const { data: allRows } = await supabase
    .from("entity_obligations")
    .select("obligation_key, status, notes, completed_at")
    .eq("org_id", orgId);

  const map = new Map<string, Obligation>();
  for (const r of allRows ?? []) {
    const row = r as {
      obligation_key: string;
      status: ObligationStatus;
      notes: string | null;
      completed_at: string | null;
    };
    map.set(row.obligation_key, {
      key: row.obligation_key,
      status: row.status,
      notes: row.notes,
      completed_at: row.completed_at,
    });
  }
  const obligations = expected.map(
    (k) =>
      map.get(k) ?? {
        key: k,
        status: "pending" as const,
        notes: null,
        completed_at: null,
      },
  );

  return { state: { entityType, obligations } };
}

export async function updateEntityType(
  next: EntityType,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canEdit(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("organizations")
    .update({ entity_type: next })
    .eq("id", orgId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "organization.entity_type_changed",
    targetType: "organization",
    targetId: orgId,
    metadata: { entityType: next },
  });
  revalidatePath("/app/settings/entity");
  return {};
}

export async function setObligationStatus(
  key: string,
  status: ObligationStatus,
  notes?: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canEdit(role)) return { error: "notAuthorized" };

  const patch: Record<string, unknown> = { status };
  if (notes !== undefined) patch.notes = notes.trim() || null;
  if (status === "complete") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = user.id;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }

  const { error } = await supabase
    .from("entity_obligations")
    .update(patch)
    .eq("org_id", orgId)
    .eq("obligation_key", key);
  if (error) return { error: "generic" };

  await logActivity({
    action: "entity_obligation.updated",
    targetType: "entity_obligation",
    targetId: `${orgId}:${key}`,
    metadata: { status, key },
  });
  revalidatePath("/app/settings/entity");
  return {};
}
