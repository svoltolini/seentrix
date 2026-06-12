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
        "id, type, title, version, preview_url, created_at, updated_at, creator:users(id, full_name)",
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
    creator: { id: string; full_name: string | null } | null;
  }>;

  // Sign every preview PNG in one batch so the card grid can render <img>.
  const diagrams: DiagramRecord[] = await Promise.all(
    typedDiagrams.map(async (row) => {
      let previewSigned: string | null = null;
      if (row.preview_url) {
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
 * Path layout: `<org_id>/<product_id>/<diagram_id>/{scene.json,preview.png}` —
 * stable per diagram so re-saves overwrite in place (upsert). The leading
 * org_id segment is what the storage RLS policy gates on.
 */
export async function saveDiagram(
  productId: string,
  formData: FormData,
): Promise<{ error?: string; diagramId?: string }> {
  const { supabase, user, orgId, role } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const rawId = formData.get("diagramId");
  const diagramId =
    typeof rawId === "string" && rawId.trim().length > 0
      ? rawId.trim()
      : crypto.randomUUID();
  const isUpdate = typeof rawId === "string" && rawId.trim().length > 0;

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

  if (isUpdate) {
    // Bump the version + refresh updated_at. We read the current version
    // first because PostgREST can't express `version = version + 1`
    // without an RPC.
    const { data: existing } = await supabase
      .from("product_diagrams")
      .select("version")
      .eq("id", diagramId)
      .single();
    const nextVersion =
      ((existing as { version: number } | null)?.version ?? 1) + 1;
    const patch: Record<string, unknown> = {
      title,
      type: rawType,
      scene_url: scenePath,
      version: nextVersion,
      updated_at: new Date().toISOString(),
    };
    if (hasPreview) patch.preview_url = previewPath;
    const { error } = await supabase
      .from("product_diagrams")
      .update(patch)
      .eq("id", diagramId);
    if (error) return { error: "generic" };
  } else {
    const { error } = await supabase.from("product_diagrams").insert({
      id: diagramId,
      product_id: productId,
      org_id: orgId,
      type: rawType,
      title,
      scene_url: scenePath,
      preview_url: hasPreview ? previewPath : null,
      version: 1,
      created_by: user.id,
    });
    if (error) {
      // Roll back the just-uploaded assets so we don't orphan storage.
      await supabase.storage
        .from(DIAGRAMS_BUCKET)
        .remove([scenePath, previewPath]);
      return { error: "generic" };
    }
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
