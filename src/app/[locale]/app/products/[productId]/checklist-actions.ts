"use server";

import { createClient } from "@/lib/supabase/server";
import {
  CRA_REQUIREMENTS,
  type ChecklistStatus,
} from "@/lib/constants/cra-requirements";
import { logActivity } from "@/lib/activity";

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
  assigned_to: string | null;
  assignee: ChecklistAssignee | null;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Hydrate assignees
  const ids = new Set<string>();
  for (const it of items ?? []) {
    const r = it as Record<string, unknown>;
    if (r.assigned_to) ids.add(r.assigned_to as string);
  }
  const assigneeMap = new Map<string, ChecklistAssignee>();
  if (ids.size > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url")
      .in("id", Array.from(ids));
    for (const u of users ?? []) {
      const row = u as ChecklistAssignee;
      assigneeMap.set(row.id, row);
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
      assigned_to: (r.assigned_to as string | null) ?? null,
      assignee: r.assigned_to
        ? assigneeMap.get(r.assigned_to as string) ?? null
        : null,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("checklist_items")
    .update({ status })
    .eq("id", itemId);

  if (error) return { error: "generic" };
  await logActivity({ action: "checklist.item_status_changed", targetType: "checklist", targetId: itemId, metadata: { status } });
  return {};
}

// ---------------------------------------------------------------------------
// Assign checklist item to a team member (or clear the assignment)
// ---------------------------------------------------------------------------

export async function assignChecklistItem(
  itemId: string,
  userId: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("checklist_items")
    .update({ assigned_to: userId })
    .eq("id", itemId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "checklist.item_assigned",
    targetType: "checklist",
    targetId: itemId,
    metadata: { assigneeId: userId },
  });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase.storage
    .from("evidence")
    .remove([filePath]);

  if (error) return { error: "generic" };
  await logActivity({ action: "checklist.evidence_removed", targetType: "checklist", metadata: { filePath } });
  return {};
}
