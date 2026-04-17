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

export interface ChecklistItem {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  category: string | null;
  regulation_article: string | null;
  status: ChecklistStatus;
  priority: string;
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
  let { data: items } = await supabase
    .from("checklist_items")
    .select(
      "id, product_id, title, description, category, regulation_article, status, priority"
    )
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
      .select(
        "id, product_id, title, description, category, regulation_article, status, priority"
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    items = newItems;
  }

  return {
    product: product as Product,
    items: (items ?? []) as ChecklistItem[],
  };
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
