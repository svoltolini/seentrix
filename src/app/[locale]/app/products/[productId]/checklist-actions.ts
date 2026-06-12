"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import {
  CRA_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import { canWrite } from "@/lib/constants/roles";
import { logActivity } from "@/lib/activity";

const CHECKLIST_BUCKET = "checklist-attachments";
const CHECKLIST_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChecklistAssignee {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ChecklistItem {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  category: string | null;
  regulation_article: string | null;
  status: ChecklistStatus;
  priority: string;
  /** One task can have one or more owners (join table). */
  assignees: ChecklistAssignee[];
}

/** A single message in the item's append-only audit thread. */
export interface ChecklistComment {
  id: string;
  body: string;
  created_at: string;
  user: { id: string; name: string | null; avatar_url: string | null } | null;
}

/** A file attached to an item — append-only, never deleted. */
export interface ChecklistAttachment {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
  user: { id: string; name: string | null; avatar_url: string | null } | null;
}

// Resolve the caller's org role. Mutations refuse non-write roles (the DB
// backstop in migration 00054 enforces this too; gating here gives a clean
// error and skips wasted work).
async function callerRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return (data as { role: string } | null)?.role ?? null;
}

export interface Product {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  cra_category: string | null;
  conformity_route: string | null;
}

// ---------------------------------------------------------------------------
// Load product and initialize checklist if needed
// ---------------------------------------------------------------------------

export async function loadProductChecklist(productId: string): Promise<{
  product: Product | null;
  items: ChecklistItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    return { product: null, items: [], error: "notAuthenticated" };
  }

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, type, description, cra_category, conformity_route")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { product: null, items: [], error: "productNotFound" };
  }

  // Fetch existing checklist items
  const cols =
    "id, product_id, title, description, category, regulation_article, status, priority, assigned_to";
  let { data: items } = await supabase
    .from("checklist_items")
    .select(cols)
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  // Initialize checklist if no items exist
  if (!items || items.length === 0) {
    const rows = CRA_REQUIREMENTS.map((req) => ({
      product_id: productId,
      title: req.id,
      description: null,
      category: req.part,
      regulation_article: req.article,
      status: "pending" as const,
      priority: "high" as const,
    }));

    const { error: insertError } = await supabase
      .from("checklist_items")
      .insert(rows);

    if (insertError) {
      return { product: product as Product, items: [], error: "generic" };
    }

    // Re-fetch after insert
    const { data: newItems } = await supabase
      .from("checklist_items")
      .select(cols)
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    items = newItems;
  }

  // Hydrate assignees from the join table — one task can have several.
  const itemIds = (items ?? []).map((it) => (it as { id: string }).id);
  const assigneesByItem = new Map<string, ChecklistAssignee[]>();
  if (itemIds.length > 0) {
    const { data: rows } = await supabase
      .from("checklist_item_assignees")
      .select("checklist_item_id, user:users(id, full_name, email, avatar_url)")
      .in("checklist_item_id", itemIds);
    for (const row of (rows ?? []) as unknown as Array<{
      checklist_item_id: string;
      user: ChecklistAssignee | ChecklistAssignee[] | null;
    }>) {
      const u = Array.isArray(row.user) ? row.user[0] : row.user;
      if (!u) continue;
      const list = assigneesByItem.get(row.checklist_item_id) ?? [];
      list.push(u);
      assigneesByItem.set(row.checklist_item_id, list);
    }
  }

  const hydrated: ChecklistItem[] = (items ?? []).map((it) => {
    const r = it as Record<string, unknown>;
    return {
      id: r.id as string,
      product_id: r.product_id as string,
      title: r.title as string,
      description: (r.description as string | null) ?? null,
      category: (r.category as string | null) ?? null,
      regulation_article: (r.regulation_article as string | null) ?? null,
      status: r.status as ChecklistStatus,
      priority: r.priority as string,
      assignees: assigneesByItem.get(r.id as string) ?? [],
    };
  });

  return { product: product as Product, items: hydrated };
}

// ---------------------------------------------------------------------------
// Update checklist item status
// ---------------------------------------------------------------------------

export async function updateChecklistItemStatus(
  itemId: string,
  status: ChecklistStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(await callerRole(supabase, user.id)))
    return { error: "notAuthorized" };

  const { error } = await supabase
    .from("checklist_items")
    .update({ status })
    .eq("id", itemId);

  if (error) return { error: "generic" };
  await logActivity({ action: "checklist.item_status_changed", targetType: "checklist", targetId: itemId, metadata: { status } });
  return {};
}

// ---------------------------------------------------------------------------
// Assignees — one task can have one or more owners (join table)
// ---------------------------------------------------------------------------

export async function addChecklistAssignee(
  productId: string,
  itemId: string,
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(await callerRole(supabase, user.id)))
    return { error: "notAuthorized" };

  const { error } = await supabase
    .from("checklist_item_assignees")
    .upsert(
      {
        checklist_item_id: itemId,
        user_id: userId,
        product_id: productId,
        assigned_by: user.id,
      },
      { onConflict: "checklist_item_id,user_id" },
    );
  if (error) return { error: "generic" };

  await logActivity({
    action: "checklist.item_assigned",
    targetType: "checklist",
    targetId: itemId,
    metadata: { assigneeId: userId },
  });
  return {};
}

export async function removeChecklistAssignee(
  itemId: string,
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(await callerRole(supabase, user.id)))
    return { error: "notAuthorized" };

  const { error } = await supabase
    .from("checklist_item_assignees")
    .delete()
    .eq("checklist_item_id", itemId)
    .eq("user_id", userId);
  if (error) return { error: "generic" };
  return {};
}

// ---------------------------------------------------------------------------
// Load team members available to assign (excluding viewer-only roles)
// ---------------------------------------------------------------------------

export async function listChecklistAssignees(): Promise<{
  members: ChecklistAssignee[];
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { members: [], error: "notAuthenticated" };
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return { members: [], error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, role")
    .eq("org_id", orgId)
    .neq("role", "viewer")
    .order("full_name", { ascending: true });
  if (error) return { members: [], error: "generic" };
  return {
    members: (data ?? []).map((u) => {
      const r = u as ChecklistAssignee & { role: string };
      return {
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        avatar_url: r.avatar_url,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Update checklist item description (notes + evidence metadata)
// ---------------------------------------------------------------------------

export async function updateChecklistItemDescription(
  itemId: string,
  description: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("checklist_items")
    .update({ description })
    .eq("id", itemId);

  if (error) return { error: "generic" };
  await logActivity({ action: "checklist.item_description_changed", targetType: "checklist", targetId: itemId });
  return {};
}

// ---------------------------------------------------------------------------
// Upload evidence file to Supabase Storage
// ---------------------------------------------------------------------------

export async function uploadEvidence(
  productId: string,
  itemId: string,
  formData: FormData
): Promise<{ path: string | null; error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { path: null, error: "notAuthenticated" };

  const file = formData.get("file") as File;
  if (!file) return { path: null, error: "generic" };

  const storagePath = `${productId}/${itemId}/${file.name}`;

  const { error } = await supabase.storage
    .from("evidence")
    .upload(storagePath, file, { upsert: true });

  if (error) {
    return { path: null, error: "generic" };
  }

  await logActivity({ action: "checklist.evidence_uploaded", targetType: "checklist", targetId: itemId, targetName: file.name, metadata: { productId } });

  return { path: storagePath };
}

// ---------------------------------------------------------------------------
// Remove evidence file from Supabase Storage
// ---------------------------------------------------------------------------

export async function removeEvidence(
  filePath: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase.storage
    .from("evidence")
    .remove([filePath]);

  if (error) return { error: "generic" };
  await logActivity({ action: "checklist.evidence_removed", targetType: "checklist", metadata: { filePath } });
  return {};
}

// ---------------------------------------------------------------------------
// Audit thread — append-only comments + attachments on a checklist item.
// Mirrors the conformity-step thread contract: every entry is attributed to
// its author and can never be edited or deleted (compliance log).
// ---------------------------------------------------------------------------

export async function loadChecklistThread(itemId: string): Promise<{
  comments: ChecklistComment[];
  attachments: ChecklistAttachment[];
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { comments: [], attachments: [], error: "notAuthenticated" };

  const [{ data: commentRows }, { data: attachmentRows }] = await Promise.all([
    supabase
      .from("product_checklist_item_comments")
      .select("id, body, created_at, user:users(id, full_name, avatar_url)")
      .eq("checklist_item_id", itemId)
      .order("created_at", { ascending: true }),
    supabase
      .from("checklist_item_attachments")
      .select(
        "id, file_name, mime_type, size_bytes, storage_path, created_at, user:users(id, full_name, avatar_url)",
      )
      .eq("checklist_item_id", itemId)
      .order("created_at", { ascending: true }),
  ]);

  type UserRow = { id: string; full_name: string | null; avatar_url: string | null };
  const u = (raw: UserRow | UserRow[] | null) => {
    const row = Array.isArray(raw) ? raw[0] : raw;
    return row ? { id: row.id, name: row.full_name, avatar_url: row.avatar_url } : null;
  };

  return {
    comments: (
      (commentRows ?? []) as unknown as Array<{
        id: string;
        body: string;
        created_at: string;
        user: UserRow | UserRow[] | null;
      }>
    ).map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, user: u(r.user) })),
    attachments: (
      (attachmentRows ?? []) as unknown as Array<{
        id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        storage_path: string;
        created_at: string;
        user: UserRow | UserRow[] | null;
      }>
    ).map((r) => ({
      id: r.id,
      file_name: r.file_name,
      mime_type: r.mime_type,
      size_bytes: r.size_bytes,
      storage_path: r.storage_path,
      created_at: r.created_at,
      user: u(r.user),
    })),
  };
}

export async function addChecklistComment(
  productId: string,
  itemId: string,
  body: string,
): Promise<{ comment?: ChecklistComment; error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(await callerRole(supabase, user.id)))
    return { error: "notAuthorized" };
  const trimmed = body.trim();
  if (!trimmed) return { error: "commentRequired" };

  const { data: inserted, error } = await supabase
    .from("product_checklist_item_comments")
    .insert({
      product_id: productId,
      checklist_item_id: itemId,
      user_id: user.id,
      body: trimmed,
    })
    .select("id, body, created_at, user:users(id, full_name, avatar_url)")
    .single();
  if (error) return { error: "generic" };

  const row = inserted as unknown as {
    id: string;
    body: string;
    created_at: string;
    user:
      | { id: string; full_name: string | null; avatar_url: string | null }
      | { id: string; full_name: string | null; avatar_url: string | null }[]
      | null;
  };
  const ru = Array.isArray(row.user) ? row.user[0] : row.user;

  await logActivity({
    action: "checklist.comment_added",
    targetType: "checklist",
    targetId: itemId,
    metadata: { productId },
  });

  return {
    comment: {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      user: ru ? { id: ru.id, name: ru.full_name, avatar_url: ru.avatar_url } : null,
    },
  };
}

export async function uploadChecklistAttachment(
  productId: string,
  itemId: string,
  formData: FormData,
): Promise<{ attachment?: ChecklistAttachment; error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "notAuthenticated" };
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return { error: "notAuthenticated" };
  if (!canWrite(await callerRole(supabase, user.id)))
    return { error: "notAuthorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "noFile" };
  if (file.size > CHECKLIST_ATTACHMENT_MAX_BYTES) return { error: "fileTooLarge" };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const objectName = `${orgId}/${productId}/${itemId}/${crypto.randomUUID()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(CHECKLIST_BUCKET)
    .upload(objectName, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "uploadFailed" };

  const { data: inserted, error: insertError } = await supabase
    .from("checklist_item_attachments")
    .insert({
      product_id: productId,
      checklist_item_id: itemId,
      user_id: user.id,
      storage_path: objectName,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select(
      "id, file_name, mime_type, size_bytes, storage_path, created_at, user:users(id, full_name, avatar_url)",
    )
    .single();

  if (insertError) {
    await supabase.storage.from(CHECKLIST_BUCKET).remove([objectName]);
    return { error: "generic" };
  }

  const row = inserted as unknown as {
    id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    created_at: string;
    user:
      | { id: string; full_name: string | null; avatar_url: string | null }
      | { id: string; full_name: string | null; avatar_url: string | null }[]
      | null;
  };
  const ru = Array.isArray(row.user) ? row.user[0] : row.user;

  await logActivity({
    action: "checklist.attachment_added",
    targetType: "checklist",
    targetId: itemId,
    metadata: { productId, fileName: file.name },
  });

  return {
    attachment: {
      id: row.id,
      file_name: row.file_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      storage_path: row.storage_path,
      created_at: row.created_at,
      user: ru ? { id: ru.id, name: ru.full_name, avatar_url: ru.avatar_url } : null,
    },
  };
}

export async function getChecklistAttachmentUrl(
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return { error: "notAuthenticated" };

  const { data, error } = await supabase.storage
    .from(CHECKLIST_BUCKET)
    .createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) return { error: "generic" };
  return { url: data.signedUrl };
}
