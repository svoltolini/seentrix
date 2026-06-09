import "server-only";

import {
  PLAN_PRICES_EUR,
  AI_BOOST_PRICE,
  type OrgPlan,
} from "@/lib/constants/plans";

/**
 * Revenue maths for the admin console, computed from the billing state we
 * already store on `organizations` (no Stripe round-trip needed for MRR).
 *
 * Currency note: by design every currency charges the SAME figure (€59 = CHF 59
 * = £59), so summing the numeric amounts across EUR/CHF/GBP customers gives a
 * meaningful blended total. We surface it as a single normalised number and
 * can add a per-currency breakdown later if the FX drift ever matters.
 */

export interface OrgBillingRow {
  plan: OrgPlan | string | null;
  billing_interval: "monthly" | "annual" | string | null;
  ai_boost: boolean | null;
  stripe_subscription_id: string | null;
}

const PAID_PLANS: OrgPlan[] = ["professional", "business", "enterprise"];

function isPaid(plan: string | null | undefined): plan is OrgPlan {
  return !!plan && (PAID_PLANS as string[]).includes(plan);
}

/** Monthly-normalised recurring revenue for a single org (annual ÷ 12). */
export function monthlyRevenueForOrg(org: OrgBillingRow): number {
  if (!org.stripe_subscription_id || !isPaid(org.plan)) return 0;

  const annual = org.billing_interval === "annual";
  const plan = org.plan as keyof typeof PLAN_PRICES_EUR;
  const planPrice = PLAN_PRICES_EUR[plan];
  let total = annual ? planPrice.annual / 12 : planPrice.monthly;

  if (org.ai_boost) {
    total += annual ? AI_BOOST_PRICE.annual / 12 : AI_BOOST_PRICE.monthly;
  }
  return total;
}

/** Blended MRR across all orgs. */
export function computeMrr(orgs: OrgBillingRow[]): number {
  return orgs.reduce((sum, o) => sum + monthlyRevenueForOrg(o), 0);
}

/** Count of orgs on each plan tier. */
export function planBreakdown(
  orgs: Array<{ plan: string | null }>,
): Record<"free" | "professional" | "business" | "enterprise", number> {
  const out = { free: 0, professional: 0, business: 0, enterprise: 0 };
  for (const o of orgs) {
    const p = (o.plan ?? "free") as keyof typeof out;
    if (p in out) out[p] += 1;
    else out.free += 1;
  }
  return out;
}

/** A rounded MRR/ARR pair, ready to format. */
export function revenueSummary(orgs: OrgBillingRow[]): {
  mrr: number;
  arr: number;
} {
  const mrr = Math.round(computeMrr(orgs));
  return { mrr, arr: mrr * 12 };
}
