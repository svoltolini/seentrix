import "server-only";

import {
  getOnboardingState,
  type OnboardingState,
  type OnboardingStatsInput,
} from "./onboarding-state";

/**
 * Server-side helper that gathers the minimal data needed to compute an org's
 * onboarding/project state, then runs the shared pure `getOnboardingState()`.
 *
 * This is intentionally lightweight (a handful of indexed count queries rather
 * than the full `getDashboardStats` aggregation) because the Copilot calls it
 * on every chat turn to ground "what do I do next?" answers. All queries run
 * through the caller's RLS-scoped Supabase client. The products list is
 * explicitly filtered by `org_id` (the one table where that column lives), and
 * every child query is scoped to those product ids, so there is no
 * cross-tenant leakage even if RLS were misconfigured.
 */

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

const PROFILE_REQUIRED_COLUMNS = [
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

export async function getOnboardingSnapshot(args: {
  supabase: SupabaseClient;
  orgId: string;
}): Promise<OnboardingState> {
  const { supabase, orgId } = args;

  // Round 1: products + org profile (everything else is keyed off product ids).
  const [{ data: products }, { data: org }] = await Promise.all([
    supabase.from("products").select("id, cra_category").eq("org_id", orgId),
    supabase
      .from("organizations")
      .select(PROFILE_REQUIRED_COLUMNS.join(", "))
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const productRows =
    (products as { id: string; cra_category: string | null }[] | null) ?? [];
  const productIds = productRows.map((p) => p.id);

  const orgRecord = (org as unknown as Record<string, unknown> | null) ?? null;
  const profileComplete =
    !!orgRecord &&
    PROFILE_REQUIRED_COLUMNS.every((col) => {
      const value = orgRecord[col];
      return typeof value === "string" && value.trim() !== "";
    });

  const assessedCount = productRows.filter((p) => p.cra_category).length;

  // No products yet → short-circuit; every downstream metric is zero.
  if (productIds.length === 0) {
    return getOnboardingState({
      stats: {
        totalProducts: 0,
        assessedCount: 0,
        products: [],
        openVulnCount: 0,
        totalVulnerabilities: 0,
        overdueCount: 0,
      },
      profile: { complete: profileComplete },
    });
  }

  const today = new Date().toISOString();

  // Round 2: SBOM presence, vulnerability counts, overdue checklist count.
  // Vulnerability queries walk sbom_components → sboms → product_id; RLS
  // applies per-row via the `!inner` joins (same pattern as context-enrichment).
  const [
    { data: sbomRows },
    { count: openVulnCount },
    { count: totalVulnCount },
    { count: overdueCount },
  ] = await Promise.all([
    supabase.from("sboms").select("product_id").in("product_id", productIds),
    supabase
      .from("vulnerabilities")
      .select("id, sbom_components!inner(sboms!inner(product_id))", {
        count: "exact",
        head: true,
      })
      .in("sbom_components.sboms.product_id", productIds)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("vulnerabilities")
      .select("id, sbom_components!inner(sboms!inner(product_id))", {
        count: "exact",
        head: true,
      })
      .in("sbom_components.sboms.product_id", productIds),
    supabase
      .from("checklist_items")
      .select("id", { count: "exact", head: true })
      .in("product_id", productIds)
      .lt("due_date", today)
      .not("status", "in", '("completed","not_applicable")'),
  ]);

  const sbomProductIds = new Set(
    ((sbomRows as { product_id: string }[] | null) ?? []).map(
      (r) => r.product_id,
    ),
  );

  const stats: OnboardingStatsInput = {
    totalProducts: productRows.length,
    assessedCount,
    products: productRows.map((p) => ({
      has_sbom: sbomProductIds.has(p.id),
      cra_category: p.cra_category,
    })),
    openVulnCount: openVulnCount ?? 0,
    totalVulnerabilities: totalVulnCount ?? 0,
    overdueCount: overdueCount ?? 0,
  };

  return getOnboardingState({ stats, profile: { complete: profileComplete } });
}
