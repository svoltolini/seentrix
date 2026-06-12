"use server";

/**
 * Server actions for the Products domain.
 *
 * This module is the only path between client components and the
 * `products`, `checklist_items`, `vulnerabilities`, and related Supabase
 * tables. Anything user-initiated (create, update, delete, bulk operations)
 * goes through one of the actions here so we can:
 *   - centralise auth + org-scoping checks (every action calls
 *     `getAuthContext()` first)
 *   - emit activity-log entries via `logActivity()` for the audit trail
 *   - keep the client bundle free of Supabase write logic
 *
 * Read functions (e.g. `listProducts`, `getDashboardStats`) live here too;
 * they're co-located so a UI engineer can find every Products query in one
 * file. Keep additions grouped by purpose with a banner comment.
 */

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import { canCreateProduct, type OrgPlan } from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";
import { MS_PER_DAY } from "@/lib/time";

export type ProductActionState =
  | { productId: string; error?: never }
  | { error: string; productId?: never }
  | undefined;

export type DeleteState = { error?: string } | undefined;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { supabase, user: null, orgId: null, plan: "free" as OrgPlan };

  const orgId = user.app_metadata?.org_id as string | undefined;
  return { supabase, user, orgId: orgId ?? null, plan: "free" as OrgPlan };
}

// ---------------------------------------------------------------------------
// Load org plan + product count for limit checks
// ---------------------------------------------------------------------------

export async function getOrgProductInfo(): Promise<{
  plan: OrgPlan;
  productCount: number;
  canCreate: boolean;
}> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return { plan: "free", productCount: 0, canCreate: false };

  // Get org plan (plan column may not exist yet if migration hasn't run)
  let plan: OrgPlan = "free";
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();
    const orgRecord = org as Record<string, unknown> | null;
    if (orgRecord?.plan && typeof orgRecord.plan === "string") {
      plan = orgRecord.plan as OrgPlan;
    }
  } catch {
    // plan column may not exist yet — default to free
  }

  // Count products
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  const productCount = count ?? 0;

  return {
    plan,
    productCount,
    canCreate: canCreateProduct(plan, productCount),
  };
}

// ---------------------------------------------------------------------------
// List products for current org
// ---------------------------------------------------------------------------

export interface ProductListItem {
  id: string;
  name: string;
  type: string | null;
  image_url: string | null;
  cra_category: string | null;
  compliance_score: number;
  created_at: string;
}

/**
 * Lightweight product search for the top-bar quick-search dropdown.
 *
 * Returns at most `limit` products in the current org whose name contains the
 * query (case-insensitive). Intentionally selects only the columns the
 * dropdown renders (id, name, type, image_url, cra_category) rather than the
 * full row + compliance computation that `listProducts` does — this runs on
 * every debounced keystroke, so it stays cheap. Org scoping is enforced by
 * RLS plus the explicit org_id filter.
 */
export async function searchProducts(
  query: string,
  limit = 8,
): Promise<{
  results: Pick<
    ProductListItem,
    "id" | "name" | "type" | "image_url" | "cra_category"
  >[];
}> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return { results: [] };

  const { supabase, orgId } = await getAuthContext();
  if (!orgId) return { results: [] };

  // Escape PostgREST `ilike` wildcards so a literal % or _ in the query can't
  // widen the match set.
  const escaped = trimmed.replace(/[%_]/g, (m) => `\\${m}`);

  const { data, error } = await supabase
    .from("products")
    .select("id, name, type, image_url, cra_category")
    .eq("org_id", orgId)
    .ilike("name", `%${escaped}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return { results: [] };

  return {
    results: data.map((p) => ({
      id: p.id as string,
      name: p.name as string,
      type: (p.type as string | null) ?? null,
      image_url: (p.image_url as string | null) ?? null,
      cra_category: (p.cra_category as string | null) ?? null,
    })),
  };
}

export async function listProducts(): Promise<{
  products: ProductListItem[];
  error?: string;
}> {
  const { supabase, orgId } = await getAuthContext();

  if (!orgId) return { products: [], error: "noOrganization" };

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return { products: [], error: "generic" };

  // Calculate compliance scores for all products
  const productIds = (products ?? []).map((p) => p.id);
  const checklistMap: Record<string, { completed: number; applicable: number }> = {};

  if (productIds.length > 0) {
    const { data: items } = await supabase
      .from("checklist_items")
      .select("product_id, status")
      .in("product_id", productIds);

    if (items) {
      for (const item of items) {
        if (!checklistMap[item.product_id]) {
          checklistMap[item.product_id] = { completed: 0, applicable: 0 };
        }
        if (item.status !== "not_applicable") {
          checklistMap[item.product_id].applicable++;
          if (item.status === "completed") {
            checklistMap[item.product_id].completed++;
          }
        }
      }
    }
  }

  const result: ProductListItem[] = (products ?? []).map((p) => {
    const record = p as Record<string, unknown>;
    const stats = checklistMap[p.id];
    const score = stats && stats.applicable > 0
      ? Math.round((stats.completed / stats.applicable) * 100)
      : 0;
    return {
      id: p.id,
      name: p.name as string,
      type: (p.type as string) ?? null,
      image_url: (record.image_url as string) ?? null,
      cra_category: (p.cra_category as string) ?? null,
      compliance_score: score,
      created_at: p.created_at as string,
    };
  });

  return { products: result };
}

// ---------------------------------------------------------------------------
// Create product (simple form — no assessment)
// ---------------------------------------------------------------------------

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const result = createProductSchema.safeParse(raw);
  if (!result.success) return { error: "generic" };

  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { error: "notAuthenticated" };

  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return { error: "noOrganization" };

  // Server-side plan-limit enforcement. The UI already hides the create
  // button when at cap, but the action is reachable on its own — without
  // this check a user could POST around the disabled button and blow past
  // the plan quota. Keeps the seat/product caps symmetric.
  const { plan, productCount } = await getOrgProductInfo();
  if (!canCreateProduct(plan, productCount)) {
    return { error: "planLimitReached" };
  }

  // Upload product image if provided
  let imageUrl: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, imageFile, { contentType: imageFile.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }
  }

  const insertData: Record<string, unknown> = {
    org_id: orgId,
    name: result.data.name,
    type: result.data.type,
    description: result.data.description ?? null,
  };
  if (imageUrl) insertData.image_url = imageUrl;

  const { data: product, error } = await supabase
    .from("products")
    .insert(insertData)
    .select("id")
    .single();

  if (error || !product) return { error: "generic" };

  await logActivity({ action: "product.created", targetType: "product", targetId: product.id, targetName: result.data.name });

  return { productId: product.id };
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const result = updateProductSchema.safeParse(raw);
  if (!result.success) return { error: "generic" };

  const { supabase, user, orgId } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  // Handle image upload / removal
  const removeImage = formData.get("remove_image") === "1";
  let imageUrl: string | null | undefined = undefined; // undefined = no change

  if (removeImage) {
    imageUrl = null;
  } else {
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0 && orgId) {
      const ext = imageFile.name.split(".").pop() ?? "jpg";
      const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile, { contentType: imageFile.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }
  }

  const updateData: Record<string, unknown> = {
    name: result.data.name,
    type: result.data.type,
    description: result.data.description ?? null,
  };
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId);

  if (error) return { error: "generic" };

  await logActivity({ action: "product.updated", targetType: "product", targetId: productId, targetName: result.data.name });

  return { productId };
}

// ---------------------------------------------------------------------------
// Delete product (cascade handled by DB foreign keys)
// ---------------------------------------------------------------------------

export async function deleteProduct(productId: string): Promise<DeleteState> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { error: "notAuthenticated" };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: "generic" };

  await logActivity({ action: "product.deleted", targetType: "product", targetId: productId });

  return {};
}

// ---------------------------------------------------------------------------
// Load single product for detail pages
// ---------------------------------------------------------------------------

export interface ProductDetail {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  image_url: string | null;
  cra_category: string | null;
  conformity_route: string | null;
  requires_notified_body: boolean;
  created_at: string;
}

export async function loadProduct(productId: string): Promise<{
  product: ProductDetail | null;
  error?: string;
}> {
  const { supabase, user } = await getAuthContext();

  if (!user) return { product: null, error: "notAuthenticated" };

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) return { product: null, error: "productNotFound" };

  const record = product as Record<string, unknown>;
  return {
    product: {
      id: record.id as string,
      name: record.name as string,
      type: (record.type as string) ?? null,
      description: (record.description as string) ?? null,
      image_url: (record.image_url as string) ?? null,
      cra_category: (record.cra_category as string) ?? null,
      conformity_route: (record.conformity_route as string) ?? null,
      requires_notified_body: !!record.requires_notified_body,
      created_at: record.created_at as string,
    },
  };
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface DashboardProduct {
  id: string;
  name: string;
  type: string | null;
  cra_category: string | null;
  compliance_score: number;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  has_sbom: boolean;
}

/**
 * Dashboard activity row. Thin projection over public.activities — the same
 * table Settings → Activity reads from — so the dashboard always shows
 * the authoritative log (every logActivity() call shows up here, including
 * Academy lesson completions, incident lifecycle events, vulnerability
 * triage, DoC issuance, and so on).
 */
export interface ActivityItem {
  id: string;
  action: string;
  target_type: string | null;
  target_name: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar_url: string | null;
  user_role: string | null;
}

export interface DashboardCurrentUser {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface ComplianceTrendPoint {
  date: string;
  productId: string;
  productName: string;
  score: number;
}

export interface VulnAgingBucket {
  bucket: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ChecklistProgress {
  productId: string;
  productName: string;
  pending: number;
  in_progress: number;
  completed: number;
  not_applicable: number;
}

export interface OverdueItem {
  id: string;
  title: string;
  productName: string;
  productId: string;
  daysOverdue: number;
  priority: string;
}

export interface ActivityVelocityPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalProducts: number;
  assessedCount: number;
  avgCompliance: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  products: DashboardProduct[];
  recentActivity: ActivityItem[];
  currentUser: DashboardCurrentUser | null;
  complianceTrend: ComplianceTrendPoint[];
  vulnAging: VulnAgingBucket[];
  mttr: number | null;
  openVulnCount: number;
  checklistProgress: ChecklistProgress[];
  overdueCount: number;
  overdueItems: OverdueItem[];
  activityVelocity: ActivityVelocityPoint[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase, orgId, user } = await getAuthContext();

  if (!orgId) {
    return {
      totalProducts: 0,
      assessedCount: 0,
      avgCompliance: 0,
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      products: [],
      recentActivity: [],
      currentUser: null,
      complianceTrend: [],
      vulnAging: [],
      mttr: null,
      openVulnCount: 0,
      checklistProgress: [],
      overdueCount: 0,
      overdueItems: [],
      activityVelocity: [],
    };
  }

  // ---------------------------------------------------------------------
  // Round 1 — fetch everything that doesn't depend on any other query.
  // Before: 4 serial round-trips. After: 1 parallel round-trip.
  // ---------------------------------------------------------------------
  const [
    currentUserRes,
    orgUsersRes,
    productsRes,
    activityRowsRes,
  ] = await Promise.all([
    user
      ? supabase
          .from("users")
          .select("full_name, email, avatar_url, role")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("users")
      .select("id, full_name, avatar_url, role")
      .eq("org_id", orgId),
    supabase
      .from("products")
      .select("id, name, type, cra_category, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, actor_id, actor_name, action, target_type, target_name, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const currentUser: DashboardCurrentUser | null =
    (currentUserRes.data as DashboardCurrentUser | null) ?? null;

  const orgUsers = orgUsersRes.data;
  const userMap: Record<string, { full_name: string | null; avatar_url: string | null; role: string }> = {};
  if (orgUsers) {
    for (const u of orgUsers) {
      userMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url, role: u.role };
    }
  }

  const allProducts = productsRes.data ?? [];
  const totalProducts = allProducts.length;
  const assessedCount = allProducts.filter((p) => p.cra_category).length;
  const productIds = allProducts.map((p) => p.id);

  // Collect activity actor ids — these feed the second-round actor lookup.
  const activityRows = activityRowsRes.data ?? [];
  const activityActorIds = [
    ...new Set(
      activityRows
        .map((r) => (r as { actor_id: string | null }).actor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  // ---------------------------------------------------------------------
  // Round 2 — everything that depends on productIds or activity actor ids.
  // All parallel, so one round-trip regardless of how many queries.
  // ---------------------------------------------------------------------
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  // Activity velocity now feeds the dashboard "Project Statistics" chart,
  // which offers This week / This month / This year views. Pull from the
  // start of the current calendar year (local time) so the year view has
  // real data, and also cover the trailing ~30 days for an org created late
  // in the year. Bounded by whichever is earlier.
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const velocityStart =
    startOfYear < thirtyDaysAgo ? startOfYear : thirtyDaysAgo;
  const today = new Date().toISOString().split("T")[0];

  const [
    checklistItemsRes,
    sbomsRes,
    complianceTrendResult,
    vulnRawResult,
    mttrResult,
    overdueResult,
    activityVelocityResult,
    fullOverdueCountRes,
    actorRowsRes,
  ] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("checklist_items")
          .select("product_id, status")
          .in("product_id", productIds)
      : Promise.resolve({ data: null }),
    productIds.length > 0
      ? supabase
          .from("sboms")
          .select(
            "product_id, vulnerability_count, critical_count, high_count, medium_count, low_count",
          )
          .in("product_id", productIds)
      : Promise.resolve({ data: null }),
    // 1. Compliance trend — last 12 weeks
    supabase
      .from("compliance_snapshots")
      .select("snapshot_date, product_id, score")
      .eq("org_id", orgId)
      .gte("snapshot_date", twelveWeeksAgo.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true }),
    // 2. Vulnerability aging — open/in_progress vulns
    supabase
      .from("vulnerabilities")
      .select("id, severity, created_at, status")
      .in("status", ["open", "in_progress"]),
    // 3. MTTR — resolved vulns
    supabase
      .from("vulnerabilities")
      .select("created_at, resolved_at")
      .eq("status", "resolved")
      .not("resolved_at", "is", null),
    // 4. Overdue checklist items (top 5)
    productIds.length > 0
      ? supabase
          .from("checklist_items")
          .select("id, title, product_id, due_date, priority, status")
          .in("product_id", productIds)
          .lt("due_date", today)
          .not("status", "in", '("completed","not_applicable")')
          .order("due_date", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: null }),
    // 5. Activity velocity — from start of year (or trailing 30 days),
    //    whichever is earlier. Feeds the Project Statistics chart.
    supabase
      .from("activities")
      .select("created_at")
      .eq("org_id", orgId)
      .gte("created_at", velocityStart.toISOString()),
    // 6. Full overdue count (not just top 5)
    productIds.length > 0
      ? supabase
          .from("checklist_items")
          .select("id", { count: "exact", head: true })
          .in("product_id", productIds)
          .lt("due_date", today)
          .not("status", "in", '("completed","not_applicable")')
      : Promise.resolve({ count: 0 }),
    // 7. Activity actor details (avatars, roles)
    activityActorIds.length > 0
      ? supabase
          .from("users")
          .select("id, full_name, avatar_url, role")
          .in("id", activityActorIds)
      : Promise.resolve({ data: null }),
  ]);

  // --- Build compliance + per-product checklist progress from a SINGLE
  //     checklist_items fetch (previously this data was fetched twice). ---
  const checklistMap: Record<string, { completed: number; applicable: number }> = {};
  const progressMap: Record<string, ChecklistProgress> = {};
  const top5ProductIds = new Set(productIds.slice(0, 5));

  if (checklistItemsRes.data) {
    for (const item of checklistItemsRes.data) {
      const pid = item.product_id as string;
      if (!checklistMap[pid]) {
        checklistMap[pid] = { completed: 0, applicable: 0 };
      }
      if (item.status !== "not_applicable") {
        checklistMap[pid].applicable++;
        if (item.status === "completed") {
          checklistMap[pid].completed++;
        }
      }

      // Second pass within the same loop — per-product progress for the
      // first 5 products (the dashboard only renders the top 5).
      if (top5ProductIds.has(pid)) {
        if (!progressMap[pid]) {
          progressMap[pid] = {
            productId: pid,
            productName: "",
            pending: 0,
            in_progress: 0,
            completed: 0,
            not_applicable: 0,
          };
        }
        const status = item.status as string;
        if (status in progressMap[pid]) {
          const rec = progressMap[pid] as unknown as Record<string, number>;
          rec[status] = (rec[status] ?? 0) + 1;
        }
      }
    }
  }

  // --- Build SBOM vulnerability aggregates ---
  const sbomMap: Record<string, { vulnerability_count: number; critical_count: number; high_count: number; medium_count: number; low_count: number; has_sbom: boolean }> = {};
  if (sbomsRes.data) {
    for (const sbom of sbomsRes.data) {
      const existing = sbomMap[sbom.product_id];
      if (!existing) {
        sbomMap[sbom.product_id] = {
          vulnerability_count: sbom.vulnerability_count ?? 0,
          critical_count: sbom.critical_count ?? 0,
          high_count: sbom.high_count ?? 0,
          medium_count: sbom.medium_count ?? 0,
          low_count: sbom.low_count ?? 0,
          has_sbom: true,
        };
      } else {
        existing.vulnerability_count += sbom.vulnerability_count ?? 0;
        existing.critical_count += sbom.critical_count ?? 0;
        existing.high_count += sbom.high_count ?? 0;
        existing.medium_count += sbom.medium_count ?? 0;
        existing.low_count += sbom.low_count ?? 0;
      }
    }
  }

  let totalScore = 0;
  let scoredCount = 0;
  // SBOM aggregate totals — used as a fallback for the dashboard vuln
  // counters when the vulnerabilities table has no open/in_progress rows
  // (e.g. fresh workspaces that scanned SBOMs but never worked the tickets).
  let sbomTotalVulns = 0;
  let sbomCritical = 0;
  let sbomHigh = 0;
  let sbomMedium = 0;
  let sbomLow = 0;

  const dashboardProducts: DashboardProduct[] = allProducts.map((p) => {
    const stats = checklistMap[p.id];
    const score = stats && stats.applicable > 0
      ? Math.round((stats.completed / stats.applicable) * 100)
      : 0;
    if (stats && stats.applicable > 0) {
      totalScore += score;
      scoredCount++;
    }
    const sbomData = sbomMap[p.id];
    const vulnCount = sbomData?.vulnerability_count ?? 0;
    const critCount = sbomData?.critical_count ?? 0;
    const hiCount = sbomData?.high_count ?? 0;
    sbomTotalVulns += vulnCount;
    sbomCritical += critCount;
    sbomHigh += hiCount;
    sbomMedium += sbomData?.medium_count ?? 0;
    sbomLow += sbomData?.low_count ?? 0;

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      cra_category: p.cra_category,
      compliance_score: score,
      vulnerability_count: vulnCount,
      critical_count: critCount,
      high_count: hiCount,
      has_sbom: !!sbomData,
    };
  });

  const avgCompliance = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  // Product-id → name lookup, kept for downstream sections that build
  // product-labeled rows (compliance trend, checklist progress…).
  const productNameMap = Object.fromEntries(
    allProducts.map((p) => [p.id, p.name]),
  );

  // Recent activity — both the activity rows (Round 1) and actor profile
  // details (Round 2) are already fetched. This just stitches them.
  const activityActorMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null; role: string | null }
  > = {};
  if (actorRowsRes.data) {
    for (const row of actorRowsRes.data as Array<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      role: string | null;
    }>) {
      activityActorMap[row.id] = {
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        role: row.role,
      };
    }
  }

  const recentActivity: ActivityItem[] = activityRows.map((row) => {
    const r = row as {
      id: string;
      actor_id: string | null;
      actor_name: string | null;
      action: string;
      target_type: string | null;
      target_name: string | null;
      created_at: string;
    };
    const actor = r.actor_id ? activityActorMap[r.actor_id] : null;
    return {
      id: r.id,
      action: r.action,
      target_type: r.target_type,
      target_name: r.target_name,
      created_at: r.created_at,
      user_name: actor?.full_name ?? r.actor_name,
      user_avatar_url: actor?.avatar_url ?? null,
      user_role: actor?.role ?? null,
    };
  });

  // --- Process compliance trend ---
  const complianceTrend: ComplianceTrendPoint[] = [];
  if (complianceTrendResult.data) {
    for (const row of complianceTrendResult.data) {
      const r = row as Record<string, unknown>;
      complianceTrend.push({
        date: r.snapshot_date as string,
        productId: r.product_id as string,
        productName: productNameMap[r.product_id as string] ?? "",
        score: (r.score as number) ?? 0,
      });
    }
  }

  // --- Process vulnerability aging + severity breakdown ---
  // Both Vuln Aging and Vuln Breakdown read from the same source (open
  // and in-progress vuln tickets) so their totals stay in sync.
  const agingBuckets: VulnAgingBucket[] = [
    { bucket: "0-7d", critical: 0, high: 0, medium: 0, low: 0 },
    { bucket: "8-30d", critical: 0, high: 0, medium: 0, low: 0 },
    { bucket: "31-90d", critical: 0, high: 0, medium: 0, low: 0 },
    { bucket: "90d+", critical: 0, high: 0, medium: 0, low: 0 },
  ];
  let openVulnCount = 0;
  let openCritical = 0;
  let openHigh = 0;
  let openMedium = 0;
  let openLow = 0;

  if (vulnRawResult.data) {
    const now = Date.now();
    for (const v of vulnRawResult.data) {
      const r = v as Record<string, unknown>;
      const ageDays = Math.floor((now - new Date(r.created_at as string).getTime()) / MS_PER_DAY);
      const severity = (r.severity as string) ?? "low";
      let bucketIdx = 0;
      if (ageDays <= 7) bucketIdx = 0;
      else if (ageDays <= 30) bucketIdx = 1;
      else if (ageDays <= 90) bucketIdx = 2;
      else bucketIdx = 3;

      const bucket = agingBuckets[bucketIdx] as unknown as Record<string, number>;
      if (severity in bucket) {
        bucket[severity]++;
      }
      if (severity === "critical") openCritical++;
      else if (severity === "high") openHigh++;
      else if (severity === "medium") openMedium++;
      else if (severity === "low") openLow++;
      openVulnCount++;
    }
  }

  // --- Process MTTR ---
  let mttr: number | null = null;
  if (mttrResult.data && mttrResult.data.length > 0) {
    let totalDays = 0;
    for (const v of mttrResult.data) {
      const r = v as Record<string, unknown>;
      const created = new Date(r.created_at as string).getTime();
      const resolved = new Date(r.resolved_at as string).getTime();
      totalDays += (resolved - created) / MS_PER_DAY;
    }
    mttr = Math.round(totalDays / mttrResult.data.length);
  }

  // --- Process checklist progress (per-product status counts) ---
  // progressMap was already populated during the Round 2 checklist_items
  // pass. Just attach product names + order by allProducts slice.
  const checklistProgress: ChecklistProgress[] = [];
  for (const p of allProducts.slice(0, 5)) {
    const entry = progressMap[p.id];
    if (entry) {
      checklistProgress.push({ ...entry, productName: productNameMap[p.id] ?? "" });
    }
  }

  // --- Process overdue tasks ---
  const overdueItems: OverdueItem[] = [];
  let overdueCount = 0;

  if (overdueResult.data) {
    const nowMs = Date.now();
    for (const item of overdueResult.data) {
      const r = item as Record<string, unknown>;
      const dueDate = new Date(r.due_date as string);
      const daysOverdue = Math.ceil((nowMs - dueDate.getTime()) / MS_PER_DAY);
      overdueItems.push({
        id: r.id as string,
        title: r.title as string,
        productName: productNameMap[r.product_id as string] ?? "",
        productId: r.product_id as string,
        daysOverdue,
        priority: (r.priority as string) ?? "medium",
      });
    }
  }

  // Full overdue count (not just top 5) — already fetched in Round 2.
  overdueCount = fullOverdueCountRes.count ?? overdueItems.length;

  // --- Process activity velocity ---
  // Build a dense daily map (one entry per calendar day, no gaps) from
  // `velocityStart` through today, keyed by UTC date (YYYY-MM-DD). A dense
  // series lets the Project Statistics chart bucket by week / month / year
  // on the client without having to infer missing days. Days with no
  // activity stay at 0.
  const activityVelocity: ActivityVelocityPoint[] = [];
  const velocityMap: Record<string, number> = {};

  const cursor = new Date(
    Date.UTC(
      velocityStart.getUTCFullYear(),
      velocityStart.getUTCMonth(),
      velocityStart.getUTCDate(),
    ),
  );
  const endUtc = new Date();
  while (cursor <= endUtc) {
    velocityMap[cursor.toISOString().split("T")[0]] = 0;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (activityVelocityResult.data) {
    for (const a of activityVelocityResult.data) {
      const r = a as Record<string, unknown>;
      const day = new Date(r.created_at as string).toISOString().split("T")[0];
      if (day in velocityMap) {
        velocityMap[day]++;
      }
    }
  }

  for (const [date, count] of Object.entries(velocityMap)) {
    activityVelocity.push({ date, count });
  }
  activityVelocity.sort((a, b) => a.date.localeCompare(b.date));

  // Prefer the vulnerabilities-table totals (open + in_progress tickets —
  // same source as Vuln Aging), but fall back to SBOM scan aggregates when
  // there are no tickets at all. Otherwise a workspace that scanned SBOMs
  // but never triaged the findings into tickets would show an empty card
  // even though the scan data is right there.
  const useOpenCounts = openVulnCount > 0;
  const totalVulnerabilities = useOpenCounts ? openVulnCount : sbomTotalVulns;
  const criticalCount = useOpenCounts ? openCritical : sbomCritical;
  const highCount = useOpenCounts ? openHigh : sbomHigh;
  const mediumCount = useOpenCounts ? openMedium : sbomMedium;
  const lowCount = useOpenCounts ? openLow : sbomLow;

  return {
    totalProducts,
    assessedCount,
    avgCompliance,
    totalVulnerabilities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    products: dashboardProducts,
    recentActivity,
    currentUser,
    complianceTrend,
    vulnAging: agingBuckets,
    mttr,
    openVulnCount,
    checklistProgress,
    overdueCount,
    overdueItems,
    activityVelocity,
  };
}
