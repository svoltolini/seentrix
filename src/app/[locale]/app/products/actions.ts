"use server";

import { createClient } from "@/lib/supabase/server";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import { canCreateProduct, type OrgPlan } from "@/lib/constants/plans";
import { logActivity } from "@/lib/activity";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "notAuthenticated" };

  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return { error: "noOrganization" };

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

export interface ActivityItem {
  id: string;
  type: "assessment" | "checklist" | "sbom" | "document";
  product_name: string;
  product_id: string;
  description: string;
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

  // Fetch current user profile
  let currentUser: DashboardCurrentUser | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, email, avatar_url, role")
      .eq("id", user.id)
      .single();
    if (profile) {
      currentUser = profile as DashboardCurrentUser;
    }
  }

  // Fetch all org users for activity attribution
  const { data: orgUsers } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role")
    .eq("org_id", orgId);

  const userMap: Record<string, { full_name: string | null; avatar_url: string | null; role: string }> = {};
  if (orgUsers) {
    for (const u of orgUsers) {
      userMap[u.id] = { full_name: u.full_name, avatar_url: u.avatar_url, role: u.role };
    }
  }

  // Fetch all products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, type, cra_category, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const allProducts = products ?? [];
  const totalProducts = allProducts.length;
  const assessedCount = allProducts.filter((p) => p.cra_category).length;
  const productIds = allProducts.map((p) => p.id);

  // Calculate compliance scores
  const checklistMap: Record<string, { completed: number; applicable: number }> = {};
  // SBOM data per product
  const sbomMap: Record<string, { vulnerability_count: number; critical_count: number; high_count: number; medium_count: number; low_count: number; has_sbom: boolean }> = {};

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

    // Fetch SBOM vulnerability aggregates
    const { data: sboms } = await supabase
      .from("sboms")
      .select("product_id, vulnerability_count, critical_count, high_count, medium_count, low_count")
      .in("product_id", productIds);

    if (sboms) {
      for (const sbom of sboms) {
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
  }

  let totalScore = 0;
  let scoredCount = 0;

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

  // Fetch recent activity across tables
  const recentActivity: ActivityItem[] = [];
  const productNameMap = Object.fromEntries(allProducts.map((p) => [p.id, p.name]));

  if (productIds.length > 0) {
    // Assessment answers
    const { data: assessments } = await supabase
      .from("assessment_answers")
      .select("id, product_id, question_id, assessed_by, created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (assessments) {
      for (const a of assessments) {
        const actorId = a.assessed_by as string | null;
        const actor = actorId ? userMap[actorId] : null;
        recentActivity.push({
          id: a.id,
          type: "assessment",
          product_name: productNameMap[a.product_id] ?? "",
          product_id: a.product_id,
          description: `assessment:${a.question_id}`,
          created_at: a.created_at,
          user_name: actor?.full_name ?? currentUser?.full_name ?? null,
          user_avatar_url: actor?.avatar_url ?? currentUser?.avatar_url ?? null,
          user_role: actor?.role ?? currentUser?.role ?? null,
        });
      }
    }

    // Checklist items
    const { data: checklists } = await supabase
      .from("checklist_items")
      .select("id, product_id, title, assigned_to, created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (checklists) {
      for (const c of checklists) {
        const actorId = c.assigned_to as string | null;
        const actor = actorId ? userMap[actorId] : null;
        recentActivity.push({
          id: c.id,
          type: "checklist",
          product_name: productNameMap[c.product_id] ?? "",
          product_id: c.product_id,
          description: c.title,
          created_at: c.created_at,
          user_name: actor?.full_name ?? currentUser?.full_name ?? null,
          user_avatar_url: actor?.avatar_url ?? currentUser?.avatar_url ?? null,
          user_role: actor?.role ?? currentUser?.role ?? null,
        });
      }
    }

    // SBOMs
    const { data: sbomActivity } = await supabase
      .from("sboms")
      .select("id, product_id, sbom_format, created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (sbomActivity) {
      for (const s of sbomActivity) {
        recentActivity.push({
          id: s.id,
          type: "sbom",
          product_name: productNameMap[s.product_id] ?? "",
          product_id: s.product_id,
          description: s.sbom_format ? `SBOM (${s.sbom_format.toUpperCase()})` : "SBOM",
          created_at: s.created_at,
          user_name: currentUser?.full_name ?? null,
          user_avatar_url: currentUser?.avatar_url ?? null,
          user_role: currentUser?.role ?? null,
        });
      }
    }

    // Documents
    const { data: docs } = await supabase
      .from("documents")
      .select("id, product_id, title, created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (docs) {
      for (const d of docs) {
        recentActivity.push({
          id: d.id,
          type: "document",
          product_name: productNameMap[d.product_id] ?? "",
          product_id: d.product_id,
          description: d.title,
          created_at: d.created_at,
          user_name: currentUser?.full_name ?? null,
          user_avatar_url: currentUser?.avatar_url ?? null,
          user_role: currentUser?.role ?? null,
        });
      }
    }
  }

  // Sort all activity by date descending, take top 10
  recentActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  recentActivity.splice(10);

  // -----------------------------------------------------------------------
  // KPI queries (run in parallel)
  // -----------------------------------------------------------------------
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date().toISOString().split("T")[0];

  const [
    complianceTrendResult,
    vulnRawResult,
    mttrResult,
    overdueResult,
    activityVelocityResult,
  ] = await Promise.all([
    // 1. Compliance trend — last 12 weeks
    supabase
      .from("compliance_snapshots")
      .select("snapshot_date, product_id, score")
      .eq("org_id", orgId)
      .gte("snapshot_date", twelveWeeksAgo.toISOString().split("T")[0])
      .order("snapshot_date", { ascending: true }),

    // 2. Vulnerability aging — open/in_progress vulns with severity + age
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

    // 4. Overdue checklist items
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

    // 5. Activity velocity — last 30 days
    supabase
      .from("activities")
      .select("created_at")
      .eq("org_id", orgId)
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

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
      const ageDays = Math.floor((now - new Date(r.created_at as string).getTime()) / 86400000);
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
      totalDays += (resolved - created) / 86400000;
    }
    mttr = Math.round(totalDays / mttrResult.data.length);
  }

  // --- Process checklist progress (per-product status counts) ---
  const checklistProgress: ChecklistProgress[] = [];
  if (productIds.length > 0) {
    const progressMap: Record<string, ChecklistProgress> = {};
    // Re-use the checklist items we already fetched (items variable from above)
    const { data: allChecklistItems } = await supabase
      .from("checklist_items")
      .select("product_id, status")
      .in("product_id", productIds.slice(0, 5));

    if (allChecklistItems) {
      for (const item of allChecklistItems) {
        const pid = item.product_id as string;
        if (!progressMap[pid]) {
          progressMap[pid] = {
            productId: pid,
            productName: productNameMap[pid] ?? "",
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
    // Return up to 5 products
    for (const p of allProducts.slice(0, 5)) {
      if (progressMap[p.id]) {
        checklistProgress.push(progressMap[p.id]);
      }
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
      const daysOverdue = Math.ceil((nowMs - dueDate.getTime()) / 86400000);
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

  // Get full overdue count (not just top 5)
  if (productIds.length > 0) {
    const { count: fullOverdueCount } = await supabase
      .from("checklist_items")
      .select("id", { count: "exact", head: true })
      .in("product_id", productIds)
      .lt("due_date", today)
      .not("status", "in", '("completed","not_applicable")');
    overdueCount = fullOverdueCount ?? overdueItems.length;
  }

  // --- Process activity velocity ---
  const activityVelocity: ActivityVelocityPoint[] = [];
  const velocityMap: Record<string, number> = {};

  // Fill all 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    velocityMap[d.toISOString().split("T")[0]] = 0;
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

  return {
    totalProducts,
    assessedCount,
    avgCompliance,
    // Dashboard-wide vuln counters now reflect open + in-progress tickets
    // (same source as Vuln Aging) rather than historical SBOM scan results,
    // so the stat card, breakdown, and aging chart all show the same totals.
    totalVulnerabilities: openVulnCount,
    criticalCount: openCritical,
    highCount: openHigh,
    mediumCount: openMedium,
    lowCount: openLow,
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
