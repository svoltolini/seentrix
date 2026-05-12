"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import {
  STEP_ATTACHMENT_ALLOWED_MIMES,
  STEP_ATTACHMENT_MAX_BYTES,
} from "./constants";

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

export interface StepComment {
  id: string;
  body: string;
  created_at: string;
  /** Snapshot of the author at comment time. `null` user_id means the
   *  account has since been deleted; we still want to render the body
   *  for audit-log purposes, with an "unknown user" fallback. */
  user: {
    id: string | null;
    name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export interface StepAttachment {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
  user: {
    id: string | null;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

// Constants for attachment size + MIME allowlist live in
// `./constants.ts` because Next.js "use server" files can only
// export async functions (a primitive export trips a build-time
// error). Imported at the top of this file.

export interface ConformityStep {
  id?: string;
  key: string;
  status: ConformityStepStatus;
  /**
   * @deprecated single-line notes were replaced by the comment thread
   * (see `comments` below). Kept on the row for backwards-compat with
   * pre-migration data but no longer rendered.
   */
  notes: string | null;
  comments: StepComment[];
  attachments: StepAttachment[];
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

  // Fetch the comment thread for every step in one round-trip. The
  // RLS policy on `product_conformity_step_comments` already enforces
  // org isolation; joining `users` gives us the author snapshot for
  // each comment without a second query.
  const { data: commentRows } = await supabase
    .from("product_conformity_step_comments")
    .select(
      "id, step_key, body, created_at, user_id, user:users(id, full_name, avatar_url, role)",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  // Attachments per step — same join shape as the comment fetch.
  const { data: attachmentRows } = await supabase
    .from("product_conformity_step_attachments")
    .select(
      "id, step_key, file_name, mime_type, size_bytes, storage_path, created_at, user:users(id, full_name, avatar_url)",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  const attachmentsByStep = new Map<string, StepAttachment[]>();
  const typedAttachments = (attachmentRows ?? []) as unknown as Array<{
    id: string;
    step_key: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    created_at: string;
    user:
      | {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }
      | null;
  }>;
  for (const row of typedAttachments) {
    const arr = attachmentsByStep.get(row.step_key) ?? [];
    arr.push({
      id: row.id,
      file_name: row.file_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      storage_path: row.storage_path,
      created_at: row.created_at,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.full_name,
            avatar_url: row.user.avatar_url,
          }
        : null,
    });
    attachmentsByStep.set(row.step_key, arr);
  }

  const commentsByStep = new Map<string, StepComment[]>();
  // PostgREST returns a foreign-key join as an array even when the
  // relation is one-to-one. Cast through `unknown` then pick the
  // first (and only) entry per row.
  const typedComments = (commentRows ?? []) as unknown as Array<{
    id: string;
    step_key: string;
    body: string;
    created_at: string;
    user_id: string | null;
    user:
      | {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
        }
      | null;
  }>;
  for (const row of typedComments) {
    const arr = commentsByStep.get(row.step_key) ?? [];
    arr.push({
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.full_name,
            avatar_url: row.user.avatar_url,
            role: row.user.role,
          }
        : { id: row.user_id, name: null, avatar_url: null, role: null },
    });
    commentsByStep.set(row.step_key, arr);
  }

  const steps: ConformityStep[] = expected.map((k) => {
    const row = stepMap.get(k);
    return {
      id: row?.id,
      key: k,
      status: row?.status ?? "pending",
      notes: row?.notes ?? null,
      comments: commentsByStep.get(k) ?? [],
      attachments: attachmentsByStep.get(k) ?? [],
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
  /**
   * Mandatory comment body for the status change. Persisted as a row
   * in `product_conformity_step_comments` so the change is captured
   * in the append-only audit log alongside any prior context.
   */
  comment: string,
): Promise<{ error?: string; comment?: StepComment }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const trimmed = comment.trim();
  if (!trimmed) return { error: "commentRequired" };

  const patch: Record<string, unknown> = { status };
  if (status === "complete") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = user.id;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }

  const { error: stepError } = await supabase
    .from("product_conformity_steps")
    .update(patch)
    .eq("product_id", productId)
    .eq("step_key", stepKey);
  if (stepError) return { error: "generic" };

  // Append the comment row. Failure here doesn't roll back the
  // status (Supabase doesn't expose multi-table transactions to
  // PostgREST) — the alternative would be a SECURITY DEFINER function,
  // worth adding if we see real-world inconsistencies.
  const { data: inserted, error: commentError } = await supabase
    .from("product_conformity_step_comments")
    .insert({
      product_id: productId,
      step_key: stepKey,
      user_id: user.id,
      body: trimmed,
    })
    .select(
      "id, body, created_at, user:users(id, full_name, avatar_url, role)",
    )
    .single();

  if (commentError) {
    // Status DID land, comment didn't. Surface a soft error so the UI
    // can show a banner without rolling back the visible state.
    return { error: "commentSaveFailed" };
  }

  const row = inserted as unknown as {
    id: string;
    body: string;
    created_at: string;
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      role: string | null;
    } | null;
  };

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
  return {
    comment: {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.full_name,
            avatar_url: row.user.avatar_url,
            role: row.user.role,
          }
        : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Standalone comment (independent of a status change)
// ---------------------------------------------------------------------------

export async function addStepComment(
  productId: string,
  stepKey: string,
  body: string,
): Promise<{ error?: string; comment?: StepComment }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const trimmed = body.trim();
  if (!trimmed) return { error: "commentRequired" };

  const { data: inserted, error } = await supabase
    .from("product_conformity_step_comments")
    .insert({
      product_id: productId,
      step_key: stepKey,
      user_id: user.id,
      body: trimmed,
    })
    .select(
      "id, body, created_at, user:users(id, full_name, avatar_url, role)",
    )
    .single();

  if (error) return { error: "generic" };

  const row = inserted as unknown as {
    id: string;
    body: string;
    created_at: string;
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      role: string | null;
    } | null;
  };

  revalidatePath(`/app/products/${productId}/conformity`);
  return {
    comment: {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.full_name,
            avatar_url: row.user.avatar_url,
            role: row.user.role,
          }
        : null,
    },
  };
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

// ---------------------------------------------------------------------------
// Attachments — file uploads on workflow steps
// ---------------------------------------------------------------------------

/**
 * Upload a file to the `conformity-attachments` bucket and create a
 * matching metadata row in `product_conformity_step_attachments`.
 *
 * Path layout: `<org_id>/<product_id>/<step_key>/<uuid>-<name>` —
 * the leading `org_id` segment is what the storage RLS policy uses
 * to gate access, mirroring the `document-pdfs` bucket pattern.
 */
export async function uploadStepAttachment(
  productId: string,
  stepKey: string,
  formData: FormData,
): Promise<{ error?: string; attachment?: StepAttachment }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const file = formData.get("file");
  const rawDisplayName = formData.get("displayName");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "noFile" };
  }
  if (file.size > STEP_ATTACHMENT_MAX_BYTES) {
    return { error: "fileTooLarge" };
  }
  if (
    !STEP_ATTACHMENT_ALLOWED_MIMES.includes(
      file.type as (typeof STEP_ATTACHMENT_ALLOWED_MIMES)[number],
    )
  ) {
    return { error: "unsupportedMime" };
  }

  // Optional user-chosen display name. Falls back to the original
  // file's basename when blank. The displayed name lands in
  // `file_name` (what the UI renders + the auto-comment quotes); the
  // storage path always uses the original basename + uuid for safety.
  const displayName =
    typeof rawDisplayName === "string" && rawDisplayName.trim().length > 0
      ? rawDisplayName.trim()
      : file.name;

  // Path: <org_id>/<product_id>/<step_key>/<uuid>-<sanitized_name>.
  // Sanitization replaces anything outside [a-zA-Z0-9._-] with `_`
  // so Supabase storage doesn't gag on emoji / spaces / unicode.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const objectName = `${orgId}/${productId}/${stepKey}/${crypto.randomUUID()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("conformity-attachments")
    .upload(objectName, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    return { error: "uploadFailed" };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("product_conformity_step_attachments")
    .insert({
      product_id: productId,
      step_key: stepKey,
      user_id: user.id,
      storage_path: objectName,
      file_name: displayName,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select(
      "id, file_name, mime_type, size_bytes, storage_path, created_at, user:users(id, full_name, avatar_url)",
    )
    .single();

  if (insertError) {
    // Best-effort cleanup: remove the just-uploaded object so we
    // don't accumulate orphans when the metadata insert fails. Even
    // if cleanup itself fails, the storage policy makes the file
    // unreadable to anyone but a future upload at the same path.
    await supabase.storage
      .from("conformity-attachments")
      .remove([objectName]);
    return { error: "generic" };
  }

  const row = inserted as unknown as {
    id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    created_at: string;
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };

  await logActivity({
    action: "conformity.attachment_added",
    targetType: "conformity_step",
    targetId: `${productId}:${stepKey}`,
    metadata: { productId, stepKey, fileName: file.name },
  });
  revalidatePath(`/app/products/${productId}/conformity`);

  return {
    attachment: {
      id: row.id,
      file_name: row.file_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      storage_path: row.storage_path,
      created_at: row.created_at,
      user: row.user
        ? {
            id: row.user.id,
            name: row.user.full_name,
            avatar_url: row.user.avatar_url,
          }
        : null,
    },
  };
}

/**
 * Generate a short-lived signed URL the client can use to download
 * an attachment. Default expiry: 60 seconds — enough for a click-
 * through to start the download, not enough for the URL to leak
 * meaningfully if logged.
 */
export async function getAttachmentDownloadUrl(
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };

  const { data, error } = await supabase.storage
    .from("conformity-attachments")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) return { error: "generic" };
  return { url: data.signedUrl };
}
