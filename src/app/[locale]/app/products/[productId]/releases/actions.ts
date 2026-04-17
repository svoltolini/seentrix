"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export type ReleaseType = "security" | "feature" | "bugfix" | "maintenance";

export interface ProductRelease {
  id: string;
  product_id: string;
  version: string;
  released_at: string;
  release_type: ReleaseType;
  cves_fixed: string[];
  release_notes: string | null;
  signed_digest: string | null;
  is_security_update: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ProductSupport {
  support_period_start: string | null;
  support_period_end: string | null;
  update_channel: string | null;
}

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
function canWrite(role: string | null) {
  return !!role && ROLES_CAN_WRITE.has(role);
}

export async function loadProductSupport(
  productId: string,
): Promise<{ support: ProductSupport | null; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { support: null, error: "notAuthenticated" };
  const { data, error } = await supabase
    .from("products")
    .select("support_period_start, support_period_end, update_channel")
    .eq("id", productId)
    .single();
  if (error) return { support: null, error: "generic" };
  return { support: data as unknown as ProductSupport };
}

export async function updateProductSupport(
  productId: string,
  patch: Partial<ProductSupport>,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", productId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "product.support_updated",
    targetType: "product",
    targetId: productId,
    metadata: patch as Record<string, unknown>,
  });
  revalidatePath(`/app/products/${productId}/releases`);
  revalidatePath("/app/dashboard");
  return {};
}

export async function listReleases(
  productId: string,
): Promise<{ releases: ProductRelease[]; error?: string }> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { releases: [], error: "notAuthenticated" };
  const { data, error } = await supabase
    .from("product_releases")
    .select(
      "id, product_id, version, released_at, release_type, cves_fixed, release_notes, signed_digest, is_security_update, created_by, created_at",
    )
    .eq("product_id", productId)
    .order("released_at", { ascending: false });
  if (error) return { releases: [], error: "generic" };
  return {
    releases: (data ?? []).map((r) => {
      const row = r as unknown as ProductRelease;
      return { ...row, cves_fixed: row.cves_fixed ?? [] };
    }),
  };
}

export interface CreateReleaseInput {
  version: string;
  released_at?: string;
  release_type?: ReleaseType;
  cves_fixed?: string[];
  release_notes?: string;
  signed_digest?: string;
  is_security_update?: boolean;
}

export async function createRelease(
  productId: string,
  input: CreateReleaseInput,
): Promise<{ id?: string; error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };
  if (!input.version.trim()) return { error: "versionRequired" };

  const { data, error } = await supabase
    .from("product_releases")
    .insert({
      product_id: productId,
      version: input.version.trim(),
      released_at: input.released_at ?? new Date().toISOString().slice(0, 10),
      release_type: input.release_type ?? "security",
      cves_fixed: input.cves_fixed ?? [],
      release_notes: input.release_notes ?? null,
      signed_digest: input.signed_digest ?? null,
      is_security_update:
        input.is_security_update ??
        (input.release_type === "security" ||
          (input.cves_fixed?.length ?? 0) > 0),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "generic" };

  const row = data as { id: string };
  await logActivity({
    action: "release.published",
    targetType: "release",
    targetId: row.id,
    targetName: input.version,
    metadata: {
      productId,
      releaseType: input.release_type ?? "security",
      cvesFixed: input.cves_fixed?.length ?? 0,
    },
  });
  revalidatePath(`/app/products/${productId}/releases`);
  revalidatePath("/app/dashboard");
  return { id: row.id };
}

export async function deleteRelease(
  releaseId: string,
  productId: string,
): Promise<{ error?: string }> {
  const { supabase, user, role } = await getAuthContext();
  if (!user) return { error: "notAuthenticated" };
  if (!canWrite(role)) return { error: "notAuthorized" };

  const { error } = await supabase
    .from("product_releases")
    .delete()
    .eq("id", releaseId);
  if (error) return { error: "generic" };

  await logActivity({
    action: "release.deleted",
    targetType: "release",
    targetId: releaseId,
    metadata: { productId },
  });
  revalidatePath(`/app/products/${productId}/releases`);
  return {};
}

// ---------------------------------------------------------------------------
// Dashboard widget — support-period rollup across all org products
// ---------------------------------------------------------------------------

export interface SupportWidgetData {
  inSupport: number;
  expiringWithin90: number;
  outOfSupport: number;
  missingSupportDates: number;
}

export async function getSupportWidget(): Promise<SupportWidgetData> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return {
      inSupport: 0,
      expiringWithin90: 0,
      outOfSupport: 0,
      missingSupportDates: 0,
    };
  }
  const { data } = await supabase
    .from("products")
    .select("support_period_end")
    .eq("org_id", orgId);

  const rows = (data ?? []) as { support_period_end: string | null }[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonCutoff = new Date(today.getTime() + 90 * 24 * 3600 * 1000);

  let inSupport = 0;
  let expiringWithin90 = 0;
  let outOfSupport = 0;
  let missing = 0;

  for (const r of rows) {
    if (!r.support_period_end) {
      missing++;
      continue;
    }
    const end = new Date(r.support_period_end);
    if (end < today) outOfSupport++;
    else if (end < soonCutoff) expiringWithin90++;
    else inSupport++;
  }

  return {
    inSupport,
    expiringWithin90,
    outOfSupport,
    missingSupportDates: missing,
  };
}
