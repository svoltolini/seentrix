import type { OrgPlan } from "./plans";

/**
 * Feature-by-feature comparison matrix rendered underneath the tier cards
 * on the public /pricing page. Structured as data so the JSX stays thin —
 * every category and every row is declared here once; translations live in
 * messages/<locale>/pricing.json under `comparison.categories.<cat>.rows
 * .<row>.label` so German renders the same shape with native labels.
 *
 * Cell values:
 *   - true          → ✓ (included)
 *   - false         → — (not available)
 *   - "unlimited"   → ∞ symbol
 *   - "coming-soon" → badge, treated as not-yet-included
 *   - number        → rendered as-is ("3", "15", etc.)
 *   - string        → literal ("Daily", "Real-time", "48h")
 *
 * Upcoming features appear in the table (so customers understand the
 * roadmap) but are tagged "coming-soon" so the current plan doesn't lie.
 */

export type CellValue =
  | boolean
  | number
  | "unlimited"
  | "coming-soon"
  | string;

export interface FeatureRow {
  key: string;
  free: CellValue;
  professional: CellValue;
  business: CellValue;
  enterprise: CellValue;
}

export interface FeatureCategory {
  key: string;
  rows: FeatureRow[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    key: "limits",
    rows: [
      { key: "products", free: 1, professional: 3, business: 15, enterprise: "unlimited" },
      { key: "users", free: 1, professional: 3, business: 10, enterprise: "unlimited" },
      { key: "sbomUploads", free: false, professional: "unlimited", business: "unlimited", enterprise: "unlimited" },
      { key: "activityLogRetention", free: "30 days", professional: "90 days", business: "unlimited", enterprise: "unlimited" },
    ],
  },
  {
    key: "craCompliance",
    rows: [
      { key: "scopeAssessment", free: true, professional: true, business: true, enterprise: true },
      { key: "productClassification", free: true, professional: true, business: true, enterprise: true },
      { key: "complianceChecklist", free: true, professional: true, business: true, enterprise: true },
      { key: "conformityAssessment", free: true, professional: true, business: true, enterprise: true },
      { key: "entityRoleObligations", free: true, professional: true, business: true, enterprise: true },
      { key: "notifiedBodyTracking", free: true, professional: true, business: true, enterprise: true },
    ],
  },
  {
    key: "sbomVulns",
    rows: [
      { key: "sbomUpload", free: false, professional: true, business: true, enterprise: true },
      { key: "componentCatalog", free: false, professional: true, business: true, enterprise: true },
      { key: "vulnScanning", free: false, professional: true, business: true, enterprise: true },
      { key: "kevFlagging", free: false, professional: true, business: true, enterprise: true },
      { key: "cvssBucketing", free: false, professional: true, business: true, enterprise: true },
      { key: "triageMttr", free: false, professional: true, business: true, enterprise: true },
      { key: "activelyExploited", free: false, professional: true, business: true, enterprise: true },
      { key: "monitoringFrequency", free: "On-demand", professional: "Weekly", business: "Daily", enterprise: "Real-time" },
      { key: "vexCsafExport", free: false, professional: false, business: "coming-soon", enterprise: "coming-soon" },
    ],
  },
  {
    key: "documents",
    rows: [
      { key: "docPdf", free: false, professional: true, business: true, enterprise: true },
      { key: "endUserInfoPdf", free: false, professional: true, business: true, enterprise: true },
      { key: "docTemplates", free: false, professional: "Essentials", business: "Full library", enterprise: "Full + custom" },
      { key: "technicalFileBuilder", free: false, professional: false, business: "coming-soon", enterprise: "coming-soon" },
      { key: "customBranding", free: false, professional: false, business: false, enterprise: "coming-soon" },
    ],
  },
  {
    key: "incidents",
    rows: [
      { key: "incidentReporting", free: false, professional: true, business: true, enterprise: true },
      { key: "deadlineTracking", free: false, professional: true, business: true, enterprise: true },
      { key: "incidentPdf", free: false, professional: true, business: true, enterprise: true },
      { key: "enisaFilingAssist", free: false, professional: false, business: "coming-soon", enterprise: "coming-soon" },
      { key: "cveLinkage", free: false, professional: true, business: true, enterprise: true },
    ],
  },
  {
    key: "psirt",
    rows: [
      { key: "publicPsirtPage", free: false, professional: false, business: true, enterprise: true },
      { key: "securityTxt", free: false, professional: false, business: true, enterprise: true },
      { key: "publicVulnIntake", free: false, professional: false, business: true, enterprise: true },
      { key: "psirtTriageWorkflow", free: false, professional: false, business: true, enterprise: true },
    ],
  },
  {
    key: "lifecycle",
    rows: [
      { key: "releasesTracking", free: true, professional: true, business: true, enterprise: true },
      { key: "supportPeriodTracking", free: true, professional: true, business: true, enterprise: true },
      { key: "updateChannelTracking", free: true, professional: true, business: true, enterprise: true },
    ],
  },
  {
    key: "training",
    rows: [
      { key: "academyLessons", free: "Full access", professional: "Full access", business: "Full access", enterprise: "Full access" },
      { key: "quizzesCertificates", free: true, professional: true, business: true, enterprise: true },
      { key: "teamProgressTracking", free: false, professional: true, business: true, enterprise: true },
      { key: "csvExport", free: false, professional: true, business: true, enterprise: true },
      { key: "byScreenRecommendations", free: true, professional: true, business: true, enterprise: true },
      { key: "glossary", free: true, professional: true, business: true, enterprise: true },
    ],
  },
  {
    key: "dataExports",
    rows: [
      { key: "gdprExport", free: true, professional: true, business: true, enterprise: true },
      { key: "gdprDelete", free: true, professional: true, business: true, enterprise: true },
      { key: "activityCsv", free: false, professional: true, business: true, enterprise: true },
      { key: "siemLogExport", free: false, professional: false, business: false, enterprise: "coming-soon" },
      // EU data residency is a flat product guarantee, not a tier upsell —
      // every plan stores customer data in eu-west-2 (London) Supabase.
      { key: "dataResidency", free: "EU", professional: "EU", business: "EU", enterprise: "EU" },
      // Billing currency lives next to data residency — both are
      // organisation-wide facts procurement teams scan for, not per-tier
      // upsells. Used to live in its own Localisation category but that
      // became single-row after the languages line was removed.
      { key: "currencyBilling", free: "EUR", professional: "EUR", business: "EUR", enterprise: "EUR" },
    ],
  },
  {
    key: "integrations",
    rows: [
      { key: "apiAccess", free: false, professional: false, business: "1000 req/day", enterprise: "Unlimited" },
      { key: "webhooks", free: false, professional: false, business: "coming-soon", enterprise: "coming-soon" },
      { key: "ssoSaml", free: false, professional: false, business: false, enterprise: "coming-soon" },
      { key: "parentChildOrgs", free: false, professional: false, business: false, enterprise: "coming-soon" },
      { key: "marketSurveillanceBundle", free: false, professional: false, business: false, enterprise: "coming-soon" },
    ],
  },
  {
    key: "security",
    rows: [
      { key: "twoFactor", free: true, professional: true, business: true, enterprise: true },
      { key: "roleBasedAccess", free: true, professional: true, business: true, enterprise: true },
      { key: "multiAdminDeletion", free: "coming-soon", professional: "coming-soon", business: "coming-soon", enterprise: "coming-soon" },
      { key: "auditLog", free: true, professional: true, business: true, enterprise: true },
      { key: "rowLevelSecurity", free: true, professional: true, business: true, enterprise: true },
      { key: "rateLimiting", free: true, professional: true, business: true, enterprise: true },
    ],
  },
  {
    key: "support",
    rows: [
      // Phone tier replaced with live chat — matches the actual support
      // channel mix we run (live chat via in-product widget for paid
      // plans, email for everyone, dedicated CSM for enterprise). Phone
      // support is not currently offered.
      { key: "supportChannel", free: "Community", professional: "Email", business: "Priority email + live chat", enterprise: "Dedicated CSM + live chat" },
      { key: "onboarding", free: "Self-serve", professional: "Self-serve", business: "1h guided call", enterprise: "2-week guided" },
      { key: "customMsa", free: false, professional: false, business: false, enterprise: true },
    ],
  },
];

/**
 * Type-safe helper: given a category/row pair, return the cell for a plan.
 */
export function getCell(row: FeatureRow, plan: OrgPlan): CellValue {
  return row[plan];
}
