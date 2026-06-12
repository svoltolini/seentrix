"use server";

import { revalidatePath } from "next/cache";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import {
  DIAGRAM_TYPES,
  EVIDENCE_CATEGORIES,
  EVIDENCE_ALLOWED_MIMES,
  EVIDENCE_MAX_BYTES,
  DIAGRAM_ASSET_MAX_BYTES,
  type DiagramType,
  type EvidenceCategory,
} from "./constants";

const DIAGRAMS_BUCKET = "product-diagrams";
const EVIDENCE_BUCKET = "product-evidence";

export interface DiagramRecord {
  id: string;
  type: DiagramType;
  title: string;
  version: number;
  created_at: string;
  updated_at: string;
  /** Set when this version was superseded or manually archived. */
  archived_at: string | null;
  /** Short-lived signed URL for the preview PNG, or null if not exported. */
  preview_signed_url: string | null;
  created_by: {
    id: string | null;
    name: string | null;
  } | null;
}

export interface EvidenceRecord {
  id: string;
  category: EvidenceCategory;
  title: string;
  file_name: string;
  file_size: number;
  mime: string;
  annex_vii_point: string | null;
  created_at: string;
  created_by: {
    id: string | null;
    name: string | null;
  } | null;
}

export interface DiagramsState {
  productName: string;
  diagrams: DiagramRecord[];
  evidence: EvidenceRecord[];
}

// ---------------------------------------------------------------------------
// Auth + role gating (mirrors the conformity surface)
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
function canWrite(r: string | null) {
  return !!r && ROLES_CAN_WRITE.has(r);
}

function isDiagramType(v: unknown): v is DiagramType {
  return (
    typeof v === "string" &&
    (DIAGRAM_TYPES as readonly string[]).includes(v)
  );
}

function isEvidenceCategory(v: unknown): v is EvidenceCategory {
  return (
    typeof v === "string" &&
    (EVIDENCE_CATEGORIES as readonly string[]).includes(v)
  );
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadDiagramsAndEvidence(
  productId: string,
): Promise<{ state: DiagramsState | null; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { state: null, error: "notAuthenticated" };

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .single();
  if (!product) return { state: null, error: "notFound" };

  const [{ data: diagramRows }, { data: evidenceRows }] = await Promise.all([
    supabase
      .from("product_diagrams")
      .select(
        "id, type, title, version, preview_url, created_at, updated_at, archived_at, creator:users(id, full_name)",
      )
      .eq("product_id", productId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("product_evidence")
      .select(
        "id, category, title, file_name, file_size, mime, annex_vii_point, created_at, creator:users(id, full_name)",
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
  ]);

  const typedDiagrams = (diagramRows ?? []) as unknown as Array<{
    id: string;
    type: DiagramType;
    title: string;
    version: number;
    preview_url: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    creator: { id: string; full_name: string | null } | null;
  }>;

  // Sign preview PNGs for the ACTIVE diagrams only — the archive renders as
  // a compact text list, so signing its previews would be wasted round-trips.
  const diagrams: DiagramRecord[] = await Promise.all(
    typedDiagrams.map(async (row) => {
      let previewSigned: string | null = null;
      if (row.preview_url && !row.archived_at) {
        const { data: signed } = await supabase.storage
          .from(DIAGRAMS_BUCKET)
          .createSignedUrl(row.preview_url, 3600);
        previewSigned = signed?.signedUrl ?? null;
      }
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        version: row.version,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived_at: row.archived_at,
        preview_signed_url: previewSigned,
        created_by: row.creator
          ? { id: row.creator.id, name: row.creator.full_name }
          : null,
      };
    }),
  );

  const typedEvidence = (evidenceRows ?? []) as unknown as Array<{
    id: string;
    category: EvidenceCategory;
    title: string;
    file_name: string;
    file_size: number;
    mime: string;
    annex_vii_point: string | null;
    created_at: string;
    creator: { id: string; full_name: string | null } | null;
  }>;

  const evidence: EvidenceRecord[] = typedEvidence.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    file_name: row.file_name,
    file_size: row.file_size,
    mime: row.mime,
    annex_vii_point: row.annex_vii_point,
    created_at: row.created_at,
    created_by: row.creator
      ? { id: row.creator.id, name: row.creator.full_name }
      : null,
  }));

  return {
    state: {
      productName: (product as { name: string }).name ?? "",
      diagrams,
      evidence,
    },
  };
}

// ---------------------------------------------------------------------------
// Diagram mutations
// ---------------------------------------------------------------------------

/**
 * Create or update a diagram. The client exports the Excalidraw scene as a
 * JSON string (via `serializeAsJSON`) and a PNG blob (via `exportToBlob`),
 * then posts both in `formData`:
 *   - `diagramId`  optional — present when re-saving an existing diagram
 *   - `type`       one of DIAGRAM_TYPES (required on create)
 *   - `title`      display title
 *   - `scene`      the scene JSON (application/json blob)
 *   - `preview`    the exported PNG (image/png blob)
 *
 * Versioning: at most one ACTIVE diagram exists per (product, type) — the
 * valid one. Updating doesn't overwrite: the current row is archived and a
 * NEW row (version + 1) is inserted with its own storage objects under
 * `<org_id>/<product_id>/<new_id>/{scene.json,preview.png}`, so every
 * version's drawing survives for the Annex VII record-keeping trail.
 */
export async function saveDiagram(
  productId: string,
  formData: FormData,
): Promise<{ error?: string; diagramId?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const rawId = formData.get("diagramId");
  const previousId =
    typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : null;
  const isUpdate = previousId !== null;
  // Every save writes a fresh row + fresh storage objects.
  const diagramId = crypto.randomUUID();

  const rawType = formData.get("type");
  const rawTitle = formData.get("title");
  const scene = formData.get("scene");
  const preview = formData.get("preview");

  if (!isDiagramType(rawType)) return { error: "invalidType" };
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length > 0
      ? rawTitle.trim()
      : null;
  if (!title) return { error: "titleRequired" };
  if (!(scene instanceof File) || scene.size === 0) {
    return { error: "noScene" };
  }
  if (scene.size > DIAGRAM_ASSET_MAX_BYTES) return { error: "sceneTooLarge" };

  // On create, refuse a second active diagram of the same type up front so
  // the user gets a meaningful error instead of a unique-index violation.
  let nextVersion = 1;
  if (isUpdate) {
    const { data: existing } = await supabase
      .from("product_diagrams")
      .select("version")
      .eq("id", previousId)
      .single();
    if (!existing) return { error: "notFound" };
    nextVersion = ((existing as { version: number }).version ?? 1) + 1;
  } else {
    const { data: activeSameType } = await supabase
      .from("product_diagrams")
      .select("id")
      .eq("product_id", productId)
      .eq("type", rawType)
      .is("archived_at", null)
      .limit(1);
    if ((activeSameType ?? []).length > 0) return { error: "typeExists" };
  }

  const basePath = `${orgId}/${productId}/${diagramId}`;
  const scenePath = `${basePath}/scene.json`;
  const previewPath = `${basePath}/preview.png`;

  const sceneBuffer = await scene.arrayBuffer();
  const { error: sceneError } = await supabase.storage
    .from(DIAGRAMS_BUCKET)
    .upload(scenePath, sceneBuffer, {
      contentType: "application/json",
      upsert: true,
    });
  if (sceneError) return { error: "uploadFailed" };

  let hasPreview = false;
  if (preview instanceof File && preview.size > 0) {
    if (preview.size > DIAGRAM_ASSET_MAX_BYTES) {
      return { error: "previewTooLarge" };
    }
    const previewBuffer = await preview.arrayBuffer();
    const { error: previewError } = await supabase.storage
      .from(DIAGRAMS_BUCKET)
      .upload(previewPath, previewBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    if (!previewError) hasPreview = true;
  }

  // Archive the previous version first — the partial unique index allows
  // only one active row per (product, type).
  if (isUpdate) {
    const { error: archiveError } = await supabase
      .from("product_diagrams")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", previousId);
    if (archiveError) {
      await supabase.storage
        .from(DIAGRAMS_BUCKET)
        .remove([scenePath, previewPath]);
      return { error: "generic" };
    }
  }

  const { error } = await supabase.from("product_diagrams").insert({
    id: diagramId,
    product_id: productId,
    org_id: orgId,
    type: rawType,
    title,
    scene_url: scenePath,
    preview_url: hasPreview ? previewPath : null,
    version: nextVersion,
    created_by: user.id,
  });
  if (error) {
    // Roll back: un-archive the previous version and drop the new assets.
    if (isUpdate) {
      await supabase
        .from("product_diagrams")
        .update({ archived_at: null })
        .eq("id", previousId);
    }
    await supabase.storage
      .from(DIAGRAMS_BUCKET)
      .remove([scenePath, previewPath]);
    return { error: "generic" };
  }

  await logActivity({
    action: isUpdate ? "diagram.updated" : "diagram.created",
    targetType: "product_diagram",
    targetId: diagramId,
    metadata: { productId, type: rawType, title },
  });
  revalidatePath(`/app/products/${productId}/diagrams`);

  // The client re-fetches via `loadDiagramsAndEvidence` after a save, so we
  // only need to hand back the id (useful for keeping the editor open on the
  // freshly-created diagram).
  return { diagramId };
}

/**
 * Restore an archived diagram version: it becomes the valid diagram of its
 * type again, and the currently-active version (if any) is archived in its
 * place. Only the latest restore wins — there is never more than one active
 * diagram per type.
 */
export async function restoreDiagram(
  diagramId: string,
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data: target } = await supabase
    .from("product_diagrams")
    .select("id, type, archived_at")
    .eq("id", diagramId)
    .single();
  const targetRow = target as {
    id: string;
    type: DiagramType;
    archived_at: string | null;
  } | null;
  if (!targetRow) return { error: "notFound" };
  if (!targetRow.archived_at) return {}; // already the active one

  // Swap: archive the current active of this type (if any), then activate.
  const { error: archiveError } = await supabase
    .from("product_diagrams")
    .update({ archived_at: new Date().toISOString() })
    .eq("product_id", productId)
    .eq("type", targetRow.type)
    .is("archived_at", null);
  if (archiveError) return { error: "generic" };

  const { error: activateError } = await supabase
    .from("product_diagrams")
    .update({ archived_at: null, updated_at: new Date().toISOString() })
    .eq("id", diagramId);
  if (activateError) return { error: "generic" };

  await logActivity({
    action: "diagram.restored",
    targetType: "product_diagram",
    targetId: diagramId,
    metadata: { productId, type: targetRow.type },
  });
  revalidatePath(`/app/products/${productId}/diagrams`);
  return {};
}

export async function renameDiagram(
  diagramId: string,
  productId: string,
  title: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  const trimmed = title.trim();
  if (!trimmed) return { error: "titleRequired" };

  const { error } = await supabase
    .from("product_diagrams")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", diagramId);
  if (error) return { error: "generic" };

  revalidatePath(`/app/products/${productId}/diagrams`);
  return {};
}

export async function deleteDiagram(
  diagramId: string,
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  // Remove both storage objects first (best-effort), then the row.
  const basePath = `${orgId}/${productId}/${diagramId}`;
  await supabase.storage
    .from(DIAGRAMS_BUCKET)
    .remove([`${basePath}/scene.json`, `${basePath}/preview.png`]);

  const { error } = await supabase
    .from("product_diagrams")
    .delete()
    .eq("id", diagramId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "diagram.deleted",
    targetType: "product_diagram",
    targetId: diagramId,
    metadata: { productId },
  });
  revalidatePath(`/app/products/${productId}/diagrams`);
  return {};
}

/**
 * Fetch the saved Excalidraw scene JSON for reopening the editor. Read
 * server-side via the user's RLS-scoped client so we don't hand a signed
 * URL to the browser just to read JSON.
 */
export async function getDiagramScene(
  diagramId: string,
): Promise<{ scene?: unknown; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };

  const { data: row } = await supabase
    .from("product_diagrams")
    .select("scene_url")
    .eq("id", diagramId)
    .single();
  const scenePath = (row as { scene_url: string | null } | null)?.scene_url;
  if (!scenePath) return { error: "notFound" };

  const { data: blob, error } = await supabase.storage
    .from(DIAGRAMS_BUCKET)
    .download(scenePath);
  if (error || !blob) return { error: "generic" };

  try {
    const text = await blob.text();
    return { scene: JSON.parse(text) };
  } catch {
    return { error: "parseFailed" };
  }
}

// ---------------------------------------------------------------------------
// Evidence mutations
// ---------------------------------------------------------------------------

export async function uploadEvidence(
  productId: string,
  formData: FormData,
): Promise<{ error?: string; evidence?: EvidenceRecord }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const file = formData.get("file");
  const rawTitle = formData.get("title");
  const rawCategory = formData.get("category");
  const rawAnnex = formData.get("annexPoint");

  if (!(file instanceof File) || file.size === 0) return { error: "noFile" };
  if (file.size > EVIDENCE_MAX_BYTES) return { error: "fileTooLarge" };
  if (
    !EVIDENCE_ALLOWED_MIMES.includes(
      file.type as (typeof EVIDENCE_ALLOWED_MIMES)[number],
    )
  ) {
    return { error: "unsupportedMime" };
  }
  if (!isEvidenceCategory(rawCategory)) return { error: "invalidCategory" };
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length > 0
      ? rawTitle.trim()
      : file.name;
  const annexPoint =
    typeof rawAnnex === "string" && rawAnnex.trim().length > 0
      ? rawAnnex.trim()
      : null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const objectName = `${orgId}/${productId}/${crypto.randomUUID()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(objectName, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "uploadFailed" };

  const { data: inserted, error: insertError } = await supabase
    .from("product_evidence")
    .insert({
      product_id: productId,
      org_id: orgId,
      category: rawCategory,
      title,
      file_url: objectName,
      file_name: file.name,
      file_size: file.size,
      mime: file.type,
      annex_vii_point: annexPoint,
      created_by: user.id,
    })
    .select(
      "id, category, title, file_name, file_size, mime, annex_vii_point, created_at, creator:users(id, full_name)",
    )
    .single();

  if (insertError) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([objectName]);
    return { error: "generic" };
  }

  const row = inserted as unknown as {
    id: string;
    category: EvidenceCategory;
    title: string;
    file_name: string;
    file_size: number;
    mime: string;
    annex_vii_point: string | null;
    created_at: string;
    creator: { id: string; full_name: string | null } | null;
  };

  await logActivity({
    action: "evidence.uploaded",
    targetType: "product_evidence",
    targetId: row.id,
    metadata: { productId, category: rawCategory, fileName: file.name },
  });
  revalidatePath(`/app/products/${productId}/diagrams`);

  return {
    evidence: {
      id: row.id,
      category: row.category,
      title: row.title,
      file_name: row.file_name,
      file_size: row.file_size,
      mime: row.mime,
      annex_vii_point: row.annex_vii_point,
      created_at: row.created_at,
      created_by: row.creator
        ? { id: row.creator.id, name: row.creator.full_name }
        : null,
    },
  };
}

export async function deleteEvidence(
  evidenceId: string,
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { data: row } = await supabase
    .from("product_evidence")
    .select("file_url")
    .eq("id", evidenceId)
    .single();
  const filePath = (row as { file_url: string } | null)?.file_url;

  if (filePath) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([filePath]);
  }

  const { error } = await supabase
    .from("product_evidence")
    .delete()
    .eq("id", evidenceId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "evidence.deleted",
    targetType: "product_evidence",
    targetId: evidenceId,
    metadata: { productId },
  });
  revalidatePath(`/app/products/${productId}/diagrams`);
  return {};
}

/**
 * Resolve a short-lived signed download URL for an evidence file by id. We
 * never expose the raw storage path to the browser — the lookup happens
 * server-side under the caller's RLS-scoped client.
 */
export async function getEvidenceDownloadUrl(
  evidenceId: string,
): Promise<{ url?: string; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };

  const { data: row } = await supabase
    .from("product_evidence")
    .select("file_url")
    .eq("id", evidenceId)
    .single();
  const filePath = (row as { file_url: string } | null)?.file_url;
  if (!filePath) return { error: "notFound" };

  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) return { error: "generic" };
  return { url: data.signedUrl };
}
