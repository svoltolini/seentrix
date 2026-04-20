// Seentrix plan limits + feature gates — single source of truth consumed by
// the pricing page, the billing UI, checkout, webhooks, and every gated
// action across the app (product creation, SBOM upload, etc.).

export const PLAN_PRODUCT_LIMITS = {
  free: 1,
  professional: 3,
  business: 15,
  enterprise: Infinity,
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
  // Free tier now has a writable checklist — the read-only cap was
  // converting badly. Users need to *feel* the product working to upgrade.
  return false;
}

// ---------------------------------------------------------------------------
// Feature gating
// ---------------------------------------------------------------------------

export const PLAN_SBOM_LIMITS = {
  free: 0,
  professional: Infinity,
  business: Infinity,
  enterprise: Infinity,
} as const;

export const PLAN_USER_LIMITS = {
  free: 1,
  professional: 3,
  business: 10,
  enterprise: Infinity,
} as const;

// Activity-log retention per plan (days). Free keeps it short; Enterprise is
// unlimited (Infinity stored as 0 in the log query → unbounded).
export const PLAN_ACTIVITY_LOG_DAYS = {
  free: 30,
  professional: 90,
  business: Infinity,
  enterprise: Infinity,
} as const;

// Copilot chat transcript retention per plan (days). A scheduled daily
// job purges chat_sessions + chat_messages older than this window.
// Free is deliberately short — conversations are disposable and the
// upgrade lever is "keep your reasoning trail".
export const PLAN_COPILOT_RETENTION_DAYS = {
  free: 7,
  professional: 90,
  business: 180,
  enterprise: 365,
} as const;

// Monitoring frequency — how often the vulnerability scanner re-runs against
// a product's SBOMs. Controlled by a scheduled Supabase function; Free and
// Professional run on demand + weekly, Business runs daily, Enterprise gets
// real-time webhook alerts in addition to daily re-scans.
export const PLAN_MONITORING_FREQUENCY = {
  free: "on_demand",
  professional: "weekly",
  business: "daily",
  enterprise: "realtime",
} as const;

export function canUploadSbom(plan: OrgPlan, currentCount: number): boolean {
  const limit = PLAN_SBOM_LIMITS[plan];
  return currentCount < limit;
}

export function canGeneratePdf(plan: OrgPlan): boolean {
  // DoC, end-user info sheet, incident reports — anything that becomes a
  // legally-weighted document. Free is gated to push conversion at the
  // moment of first real compliance need.
  return plan !== "free";
}

export function canUseDocumentTemplates(plan: OrgPlan): boolean {
  return plan !== "free";
}

export function canUseContinuousMonitoring(plan: OrgPlan): boolean {
  return plan === "business" || plan === "enterprise";
}

export function canUsePsirt(plan: OrgPlan): boolean {
  // Public security.txt + /security/<slug> page — a public-surface feature
  // that needs a baseline of operational maturity, so Business+.
  return plan === "business" || plan === "enterprise";
}

export function canUseApi(plan: OrgPlan): boolean {
  return plan === "business" || plan === "enterprise";
}

export function hasFeature(
  plan: OrgPlan,
  feature:
    | "sbom"
    | "pdf"
    | "documents"
    | "monitoring"
    | "sso"
    | "psirt"
    | "api"
    | "vex_csaf"
    | "custom_branding"
    | "parent_child_org",
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
    case "psirt":
      return plan === "business" || plan === "enterprise";
    case "api":
      return plan === "business" || plan === "enterprise";
    case "vex_csaf":
      return plan === "business" || plan === "enterprise";
    case "sso":
      return plan === "enterprise";
    case "custom_branding":
      return plan === "enterprise";
    case "parent_child_org":
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

// ---------------------------------------------------------------------------
// Displayed prices (EUR). Driven by the value-metric bands we set — change
// here when the pricing page needs to update, and create matching price IDs
// in Stripe separately.
// ---------------------------------------------------------------------------
export const PLAN_PRICES_EUR = {
  free: { monthly: 0, annual: 0 },
  professional: { monthly: 59, annual: 590 }, // 2 months free
  business: { monthly: 199, annual: 1990 }, // 2 months free
  enterprise: { monthly: 749, annual: 7490 }, // 2 months free
} as const;
