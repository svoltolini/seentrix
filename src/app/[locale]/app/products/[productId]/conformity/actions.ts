"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export type ConformityRoute =
  | "module_a"
  | "module_b_c"
  | "module_h"
  | "european_certification";

export type ConformityStepStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "not_applicable";

export interface ConformityStep {
  id?: string;
  key: string;
  status: ConformityStepStatus;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

export interface ConformityState {
  productName: string;
  route: ConformityRoute;
  requiresNotifiedBody: boolean;
  notifiedBody: {
    name: string | null;
    id: string | null;
    scope: string | null;
  };
  steps: ConformityStep[];
  declarationIssuedAt: string | null;
  declarationVersion: string | null;
  checklistComplete: boolean;
  hasActiveSbom: boolean;
}

// The authoritative step catalog per conformity route. Anything unassigned
// (the manufacturer hasn't classified the product yet) gets the Module A
// self-assessment path as a default.
const STEPS_BY_ROUTE: Record<ConformityRoute, string[]> = {
  module_a: [
    "checklist_complete",
    "sbom_active",
    "technical_documentation_prepared",
    "risk_assessment_complete",
    "declaration_prepared",
    "ce_marking_affixed",
  ],
  module_b_c: [
    "checklist_complete",
    "sbom_active",
    "technical_documentation_prepared",
    "risk_assessment_complete",
    "notified_body_selected",
    "eu_type_examination_passed",
    "conformity_to_type_verified",
    "declaration_prepared",
    "ce_marking_affixed",
  ],
  module_h: [
    "checklist_complete",
    "sbom_active",
    "technical_documentation_prepared",
    "risk_assessment_complete",
    "notified_body_selected",
    "quality_system_documented",
    "quality_system_approved",
    "surveillance_audit_scheduled",
    "declaration_prepared",
    "ce_marking_affixed",
  ],
  european_certification: [
    "checklist_complete",
    "sbom_active",
    "technical_documentation_prepared",
    "risk_assessment_complete",
    "eu_certification_obtained",
    "declaration_prepared",
    "ce_marking_affixed",
  ],
};

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
const ROLES_CAN_ISSUE = new Set(["admin", "compliance_officer"]);
function canWrite(r: string | null) {
  return !!r && ROLES_CAN_WRITE.has(r);
}
function canIssue(r: string | null) {
  return !!r && ROLES_CAN_ISSUE.has(r);
}

function routeOrDefault(
  route: string | null,
  requiresNotifiedBody: boolean,
): ConformityRoute {
  if (route === "module_a") return "module_a";
  if (route === "module_b_c") return "module_b_c";
  if (route === "module_h") return "module_h";
  if (route === "european_certification") return "european_certification";
  return requiresNotifiedBody ? "module_h" : "module_a";
}

// ---------------------------------------------------------------------------
// Load + seed steps
// ---------------------------------------------------------------------------

export async function loadConformity(
  productId: string,
): Promise<{ state: ConformityState | null; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { state: null, error: "notAuthenticated" };

  const { data: product } = await supabase
    .from("products")
    .select(
      "name, conformity_route, requires_notified_body, notified_body_name, notified_body_id, notified_body_scope, declaration_issued_at, declaration_version",
    )
    .eq("id", productId)
    .single();
  if (!product) return { state: null, error: "notFound" };

  const p = product as Record<string, unknown>;
  const route = routeOrDefault(
    (p.conformity_route as string | null) ?? null,
    !!p.requires_notified_body,
  );

  // Seed missing steps so the client sees a full workflow on first load.
  const expected = STEPS_BY_ROUTE[route];
  const { data: existing } = await supabase
    .from("product_conformity_steps")
    .select("id, step_key, status, notes, completed_at, completed_by")
    .eq("product_id", productId);
  const have = new Set(
    (existing ?? []).map(
      (r) => (r as { step_key: string }).step_key,
    ),
  );
  const missing = expected.filter((k) => !have.has(k));
  if (missing.length > 0) {
    await supabase.from("product_conformity_steps").insert(
      missing.map((k) => ({
        product_id: productId,
        step_key: k,
        status: "pending",
      })),
    );
  }

  // Re-fetch to pick up any inserted rows.
  const { data: allSteps } = await supabase
    .from("product_conformity_steps")
    .select("id, step_key, status, notes, completed_at, completed_by")
    .eq("product_id", productId);

  const stepMap = new Map<
    string,
    {
      id: string;
      status: ConformityStepStatus;
      notes: string | null;
      completed_at: string | null;
      completed_by: string | null;
    }
  >();
  for (const s of allSteps ?? []) {
    const row = s as {
      id: string;
      step_key: string;
      status: ConformityStepStatus;
      notes: string | null;
      completed_at: string | null;
      completed_by: string | null;
    };
    stepMap.set(row.step_key, {
      id: row.id,
      status: row.status,
      notes: row.notes,
      completed_at: row.completed_at,
      completed_by: row.completed_by,
    });
  }

  const steps: ConformityStep[] = expected.map((k) => {
    const row = stepMap.get(k);
    return {
      id: row?.id,
      key: k,
      status: row?.status ?? "pending",
      notes: row?.notes ?? null,
      completed_at: row?.completed_at ?? null,
      completed_by: row?.completed_by ?? null,
    };
  });

  // Derive the "DoC ready" gate signals
  const [{ count: assessableCount }, { count: completedCount }, { data: sboms }] =
    await Promise.all([
      supabase
        .from("checklist_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .not("status", "in", "(not_applicable)"),
      supabase
        .from("checklist_items")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("status", "completed"),
      supabase
        .from("sboms")
        .select("id, is_active, last_scanned_at")
        .eq("product_id", productId)
        .eq("is_active", true),
    ]);

  const checklistComplete =
    (assessableCount ?? 0) > 0 && assessableCount === completedCount;
  const hasActiveSbom = (sboms ?? []).some(
    (s) => !!(s as { last_scanned_at: string | null }).last_scanned_at,
  );

  return {
    state: {
      productName: (p.name as string) ?? "",
      route,
      requiresNotifiedBody: !!p.requires_notified_body,
      notifiedBody: {
        name: (p.notified_body_name as string | null) ?? null,
        id: (p.notified_body_id as string | null) ?? null,
        scope: (p.notified_body_scope as string | null) ?? null,
      },
      steps,
      declarationIssuedAt:
        (p.declaration_issued_at as string | null) ?? null,
      declarationVersion: (p.declaration_version as string | null) ?? null,
      checklistComplete,
      hasActiveSbom,
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function setStepStatus(
  productId: string,
  stepKey: string,
  status: ConformityStepStatus,
  notes?: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const patch: Record<string, unknown> = { status };
  if (status === "complete") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = user.id;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }
  if (notes !== undefined) patch.notes = notes.trim() || null;

  const { error } = await supabase
    .from("product_conformity_steps")
    .update(patch)
    .eq("product_id", productId)
    .eq("step_key", stepKey);
  if (error) return { error: "generic" };

  await logActivity({
    action:
      status === "complete"
        ? "conformity.step_completed"
        : "conformity.step_reopened",
    targetType: "conformity_step",
    targetId: `${productId}:${stepKey}`,
    metadata: { productId, stepKey, status },
  });
  revalidatePath(`/app/products/${productId}/conformity`);
  return {};
}

export async function updateNotifiedBody(
  productId: string,
  body: {
    name?: string | null;
    id?: string | null;
    scope?: string | null;
  },
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const patch: Record<string, string | null> = {};
  if (body.name !== undefined) patch.notified_body_name = body.name?.trim() || null;
  if (body.id !== undefined) patch.notified_body_id = body.id?.trim() || null;
  if (body.scope !== undefined)
    patch.notified_body_scope = body.scope?.trim() || null;

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", productId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "conformity.notified_body_updated",
    targetType: "product",
    targetId: productId,
  });
  revalidatePath(`/app/products/${productId}/conformity`);
  return {};
}

// Required for a legally useful Declaration of Conformity (Annex V).
const DOC_REQUIRED_ORG_FIELDS = [
  "legal_name",
  "registration_number",
  "address_line1",
  "postal_code",
  "city",
  "country",
  "signatory_name",
  "signatory_position",
  "contact_email",
] as const;

export async function issueDeclaration(
  productId: string,
): Promise<{ error?: string; version?: string; missingOrgFields?: string[] }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canIssue(role)) return { error: "notAuthorized" };

  // Guard rail 1 — refuse to issue unless all non-N/A steps are complete.
  const { data: steps } = await supabase
    .from("product_conformity_steps")
    .select("status")
    .eq("product_id", productId);
  const gating = (steps ?? []).filter(
    (s) => (s as { status: string }).status !== "not_applicable",
  );
  if (
    gating.length === 0 ||
    gating.some((s) => (s as { status: string }).status !== "complete")
  ) {
    return { error: "stepsIncomplete" };
  }

  // Guard rail 2 — every legally mandatory company field must be filled.
  // The DoC PDF autofill pulls them straight from organizations, so a blank
  // here would produce an unsignable document.
  const { data: org } = await supabase
    .from("organizations")
    .select(DOC_REQUIRED_ORG_FIELDS.join(", "))
    .eq("id", orgId)
    .single();
  if (!org) return { error: "generic" };
  const orgRow = org as unknown as Record<string, string | null>;
  const missingOrgFields = DOC_REQUIRED_ORG_FIELDS.filter(
    (key) => !orgRow[key] || (orgRow[key] as string).trim() === "",
  );
  if (missingOrgFields.length > 0) {
    return { error: "orgProfileIncomplete", missingOrgFields };
  }

  const version = `DoC-${new Date().toISOString().slice(0, 10)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const { error } = await supabase
    .from("products")
    .update({
      declaration_issued_at: new Date().toISOString(),
      declaration_version: version,
    })
    .eq("id", productId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "conformity.declaration_issued",
    targetType: "product",
    targetId: productId,
    metadata: { version },
  });
  revalidatePath(`/app/products/${productId}/conformity`);
  return { version };
}
