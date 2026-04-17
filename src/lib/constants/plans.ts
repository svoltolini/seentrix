export const PLAN_PRODUCT_LIMITS = {
  free: 1,
  professional: 5,
  business: 25,
  enterprise: 100,
} as const;

export type OrgPlan = keyof typeof PLAN_PRODUCT_LIMITS;

export const PLANS: OrgPlan[] = ["free", "professional", "business", "enterprise"];

export function getProductLimit(plan: OrgPlan): number {
  return PLAN_PRODUCT_LIMITS[plan];
}

export function canCreateProduct(plan: OrgPlan, currentCount: number): boolean {
  const limit = PLAN_PRODUCT_LIMITS[plan];
  return currentCount < limit;
}

export function isChecklistReadOnly(plan: OrgPlan): boolean {
  return plan === "free";
}

// ---------------------------------------------------------------------------
// Feature gating
// ---------------------------------------------------------------------------

export const PLAN_SBOM_LIMITS = {
  free: 0,
  professional: 5,
  business: Infinity,
  enterprise: Infinity,
} as const;

export const PLAN_USER_LIMITS = {
  free: 1,
  professional: 1,
  business: 5,
  enterprise: Infinity,
} as const;

export function canUploadSbom(plan: OrgPlan, currentCount: number): boolean {
  const limit = PLAN_SBOM_LIMITS[plan];
  return currentCount < limit;
}

export function canGeneratePdf(plan: OrgPlan): boolean {
  return plan !== "free";
}

export function canUseDocumentTemplates(plan: OrgPlan): boolean {
  return plan !== "free";
}

export function canUseContinuousMonitoring(plan: OrgPlan): boolean {
  return plan === "business" || plan === "enterprise";
}

export function hasFeature(
  plan: OrgPlan,
  feature: "sbom" | "pdf" | "documents" | "monitoring" | "sso"
): boolean {
  switch (feature) {
    case "sbom":
      return plan !== "free";
    case "pdf":
      return plan !== "free";
    case "documents":
      return plan !== "free";
    case "monitoring":
      return plan === "business" || plan === "enterprise";
    case "sso":
      return plan === "enterprise";
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Stripe price mapping
// ---------------------------------------------------------------------------

export const STRIPE_PRICE_IDS: Record<
  Exclude<OrgPlan, "free">,
  { monthly: string; annual: string }
> = {
  professional: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? "",
  },
  business: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BIZ_MONTHLY ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_BIZ_ANNUAL ?? "",
  },
  enterprise: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENT_MONTHLY ?? "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENT_ANNUAL ?? "",
  },
};

export function getPlanFromPriceId(priceId: string): OrgPlan {
  for (const [plan, ids] of Object.entries(STRIPE_PRICE_IDS)) {
    if (ids.monthly === priceId || ids.annual === priceId) {
      return plan as OrgPlan;
    }
  }
  return "free";
}
