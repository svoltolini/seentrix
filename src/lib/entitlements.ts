import type { SupabaseClient } from "@supabase/supabase-js";
import { type OrgPlan } from "@/lib/constants/plans";

/**
 * Server-side entitlement helpers.
 *
 * The plans.ts `can*` predicates are pure; this module is the thin bridge that
 * reads the caller's org plan from the DB so server actions and API routes can
 * enforce gates (not just the UI). Always pass the request-scoped Supabase
 * client so RLS still applies to the read.
 */
export async function getOrgPlan(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgPlan> {
  const { data } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();
  return ((data as { plan?: string } | null)?.plan ?? "free") as OrgPlan;
}
