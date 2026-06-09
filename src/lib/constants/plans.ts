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

export function isChecklistReadOnly(_plan: OrgPlan): boolean {
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
// Plan amounts. The SAME figure is charged in every currency (€59 = CHF 59 =
// £59) — only the symbol changes. PLAN_PRICES_EUR keeps its name for callers
// but the numbers are currency-agnostic; formatPrice() applies the symbol.
// ---------------------------------------------------------------------------
export const PLAN_PRICES_EUR = {
  free: { monthly: 0, annual: 0 },
  professional: { monthly: 59, annual: 590 }, // 2 months free
  business: { monthly: 219, annual: 2190 }, // 2 months free
  // Enterprise is not yet purchasable — shown as "coming soon" in the UI.
  enterprise: { monthly: 749, annual: 7490 },
} as const;

// Optional AI Boost add-on (extra Copilot allowance), same figure per currency.
export const AI_BOOST_PRICE = { monthly: 49, annual: 490 } as const;
export const AI_BOOST_BONUS_MESSAGES = 300;

// ---------------------------------------------------------------------------
// Purchasable plans + the AI Boost add-on eligibility.
// ---------------------------------------------------------------------------
export const PURCHASABLE_PLANS = ["professional", "business"] as const;
export type PurchasablePlan = (typeof PURCHASABLE_PLANS)[number];

export function isPurchasable(plan: OrgPlan): plan is PurchasablePlan {
  return (PURCHASABLE_PLANS as readonly string[]).includes(plan);
}

/** The AI Boost add-on can be bought on top of any paid (purchasable) plan. */
export function canBuyAiBoost(plan: OrgPlan): boolean {
  return isPurchasable(plan);
}

// Enterprise is presented as a forthcoming tier rather than a buyable one.
export const COMING_SOON_PLANS: OrgPlan[] = ["enterprise"];

// ---------------------------------------------------------------------------
// Currency — resolved from the organisation's country. CH (and Liechtenstein)
// → CHF, UK → GBP, everyone else → EUR. The amount is identical; only the
// Stripe price object and the displayed symbol differ.
// ---------------------------------------------------------------------------
export type BillingCurrency = "eur" | "chf" | "gbp";
export type BillingInterval = "monthly" | "annual";
export const SUPPORTED_CURRENCIES: readonly BillingCurrency[] = ["eur", "chf", "gbp"];

const CURRENCY_SYMBOL: Record<BillingCurrency, string> = {
  eur: "€",
  chf: "CHF ",
  gbp: "£",
};

export function resolveCurrency(
  country: string | null | undefined,
): BillingCurrency {
  const c = (country ?? "").trim().toUpperCase();
  if (["CH", "SWITZERLAND", "LI", "LIECHTENSTEIN"].includes(c)) return "chf";
  if (["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN"].includes(c)) return "gbp";
  return "eur";
}

/** "€59", "CHF 59", "£59". */
export function formatPrice(amount: number, currency: BillingCurrency): string {
  return `${CURRENCY_SYMBOL[currency]}${amount}`;
}

// ---------------------------------------------------------------------------
// Stripe price IDs — one single-currency price per (plan × interval × currency)
// and per (add-on × interval × currency). Live-mode IDs created in the Seentrix
// Stripe account; price IDs are public (sent to the client) so they live in
// code rather than env. The secret key + webhook secret stay in env.
// ---------------------------------------------------------------------------
export const STRIPE_PRICE_IDS: Record<
  PurchasablePlan,
  Record<BillingInterval, Record<BillingCurrency, string>>
> = {
  professional: {
    monthly: {
      eur: "price_1TgP4sERTTk1fRmMNdJ2O7MB",
      chf: "price_1TgP4tERTTk1fRmM8ZpBw9MY",
      gbp: "price_1TgP4tERTTk1fRmMhGF5nw6D",
    },
    annual: {
      eur: "price_1TgP4uERTTk1fRmMlYIielcr",
      chf: "price_1TgP4uERTTk1fRmMazvRHa89",
      gbp: "price_1TgP4uERTTk1fRmMdejG3wzr",
    },
  },
  business: {
    monthly: {
      eur: "price_1TgP57ERTTk1fRmM2rwPaYUj",
      chf: "price_1TgP57ERTTk1fRmM1L7D3wDp",
      gbp: "price_1TgP57ERTTk1fRmM0YowEhR5",
    },
    annual: {
      eur: "price_1TgP58ERTTk1fRmM1jjHAxbp",
      chf: "price_1TgP58ERTTk1fRmMEfaid4K4",
      gbp: "price_1TgP59ERTTk1fRmMtqN3Mxqn",
    },
  },
};

export const STRIPE_AIBOOST_PRICE_IDS: Record<
  BillingInterval,
  Record<BillingCurrency, string>
> = {
  monthly: {
    eur: "price_1TgP5KERTTk1fRmMczLYVEyi",
    chf: "price_1TgP5KERTTk1fRmMDbRKKxQS",
    gbp: "price_1TgP5LERTTk1fRmMn8CppTi9",
  },
  annual: {
    eur: "price_1TgP5LERTTk1fRmMhc2XYqdp",
    chf: "price_1TgP5MERTTk1fRmMy8xXggbO",
    gbp: "price_1TgP5MERTTk1fRmM5gVUFew7",
  },
};

export function getPlanPriceId(
  plan: PurchasablePlan,
  interval: BillingInterval,
  currency: BillingCurrency,
): string {
  return STRIPE_PRICE_IDS[plan][interval][currency];
}

export function getAiBoostPriceId(
  interval: BillingInterval,
  currency: BillingCurrency,
): string {
  return STRIPE_AIBOOST_PRICE_IDS[interval][currency];
}

// Reverse lookup: any base price id → its plan (across all intervals/currencies).
const PRICE_ID_TO_PLAN = new Map<string, PurchasablePlan>();
for (const plan of PURCHASABLE_PLANS) {
  for (const interval of ["monthly", "annual"] as BillingInterval[]) {
    for (const currency of SUPPORTED_CURRENCIES) {
      PRICE_ID_TO_PLAN.set(STRIPE_PRICE_IDS[plan][interval][currency], plan);
    }
  }
}

const AIBOOST_PRICE_ID_SET = new Set<string>();
for (const interval of ["monthly", "annual"] as BillingInterval[]) {
  for (const currency of SUPPORTED_CURRENCIES) {
    AIBOOST_PRICE_ID_SET.add(STRIPE_AIBOOST_PRICE_IDS[interval][currency]);
  }
}

export function getPlanFromPriceId(priceId: string): OrgPlan {
  if (!priceId) return "free";
  return PRICE_ID_TO_PLAN.get(priceId) ?? "free";
}

/** True if a price id is one of the AI Boost add-on prices. */
export function isAiBoostPriceId(priceId: string | null | undefined): boolean {
  return !!priceId && AIBOOST_PRICE_ID_SET.has(priceId);
}
