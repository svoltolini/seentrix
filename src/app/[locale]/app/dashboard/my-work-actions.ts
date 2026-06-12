"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { MS_PER_DAY } from "@/lib/time";

/**
 * "My Work" dashboard data (editor home). Everything here is scoped to the
 * caller: the checklist items and vulnerabilities assigned to them, plus
 * their academy completions. No org-wide statistics — this dashboard is
 * about what the person needs to do next, not how the org is steering.
 */

export interface MyTask {
  id: string;
  /** Requirement id (translated client-side via the requirements catalogue). */
  requirementId: string;
  part: "part_i" | "part_ii";
  productId: string;
  productName: string;
  status: string;
  /** Whole days overdue (negative = days until due); null when no due date. */
  daysOverdue: number | null;
}

export interface MyVuln {
  id: string;
  cveId: string | null;
  severity: string;
  status: string;
  productId: string;
  productName: string;
}

export interface MyWorkStats {
  firstName: string | null;
  /** Assigned checklist items still open (pending / in_progress), overdue first. */
  tasks: MyTask[];
  openTaskCount: number;
  doneTaskCount: number;
  /** Assigned vulnerabilities still open, severity-sorted. */
  vulns: MyVuln[];
  completedLessonIds: string[];
  role: string | null;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function getMyWorkStats(): Promise<MyWorkStats | null> {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) return null;

  const [meRes, completionsRes, assignedRes, doneRes, vulnRes] =
    await Promise.all([
      supabase.from("users").select("full_name, role").eq("id", user.id).single(),
      supabase
        .from("academy_completions")
        .select("lesson_id")
        .eq("user_id", user.id),
      // Open checklist items assigned to me, with the product name.
      supabase
        .from("checklist_items")
        .select("id, title, category, product_id, due_date, status, products(name)")
        .eq("assigned_to", user.id)
        .not("status", "in", "(completed,not_applicable)"),
      // Completed-by-me count for the progress ring.
      supabase
        .from("checklist_items")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", user.id)
        .eq("status", "completed"),
      // Open vulnerabilities assigned to me, joined out to the product.
      supabase
        .from("vulnerabilities")
        .select(
          "id, cve_id, severity, status, sbom_components!inner(sboms!inner(product_id, products(name)))",
        )
        .eq("assigned_to", user.id)
        .not("status", "in", "(resolved,not_affected,false_positive)"),
    ]);

  const me = meRes.data as { full_name: string | null; role: string | null } | null;
  const firstName = me?.full_name?.trim()?.split(/\s+/)[0] ?? null;

  const completedLessonIds = (completionsRes.data ?? []).map(
    (r) => (r as { lesson_id: string }).lesson_id,
  );

  const now = Date.now();
  const tasks: MyTask[] = (
    (assignedRes.data ?? []) as Array<{
      id: string;
      title: string;
      category: string | null;
      product_id: string;
      due_date: string | null;
      status: string;
      products: { name: string } | { name: string }[] | null;
    }>
  ).map((r) => {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    const daysOverdue = r.due_date
      ? Math.floor((now - new Date(r.due_date).getTime()) / MS_PER_DAY)
      : null;
    return {
      id: r.id,
      requirementId: r.title,
      part: r.category === "part_ii" ? "part_ii" : "part_i",
      productId: r.product_id,
      productName: product?.name ?? "",
      status: r.status,
      daysOverdue,
    };
  });

  // Overdue first (most overdue at the top), then items with no due date.
  tasks.sort((a, b) => {
    if (a.daysOverdue === null && b.daysOverdue === null) return 0;
    if (a.daysOverdue === null) return 1;
    if (b.daysOverdue === null) return -1;
    return b.daysOverdue - a.daysOverdue;
  });

  const vulns: MyVuln[] = (
    (vulnRes.data ?? []) as unknown as Array<{
      id: string;
      cve_id: string | null;
      severity: string;
      status: string;
      sbom_components:
        | {
            sboms:
              | {
                  product_id: string;
                  products: { name: string } | { name: string }[] | null;
                }
              | { product_id: string; products: unknown }[]
              | null;
          }
        | { sboms: unknown }[]
        | null;
    }>
  )
    .map((r) => {
      const comp = Array.isArray(r.sbom_components)
        ? r.sbom_components[0]
        : r.sbom_components;
      const sbom = Array.isArray(comp?.sboms) ? comp?.sboms[0] : comp?.sboms;
      const product = Array.isArray(sbom?.products)
        ? sbom?.products[0]
        : sbom?.products;
      return {
        id: r.id,
        cveId: r.cve_id,
        severity: r.severity,
        status: r.status,
        productId: sbom?.product_id ?? "",
        productName: product?.name ?? "",
      };
    })
    .sort(
      (a, b) =>
        (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
    );

  return {
    firstName,
    tasks,
    openTaskCount: tasks.length,
    doneTaskCount: doneRes.count ?? 0,
    vulns,
    completedLessonIds,
    role: me?.role ?? null,
  };
}
