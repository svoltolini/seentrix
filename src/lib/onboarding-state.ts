/**
 * Derive a new organisation's "getting-started" state and the ordered list of
 * next steps it should take toward CRA readiness.
 *
 * This is a **pure** function over data the dashboard already fetches
 * (`DashboardStats` + `CompanyProfileStatus`), so it adds no DB round-trips and
 * is trivially unit-testable. It is consumed by:
 *   - the dashboard empty-state screen (shown when the org has no real data),
 *   - the dashboard KPI strip / calendar tracker (progress %),
 *   - the Copilot project-state context (so "what do I do next?" is accurate).
 *
 * Each step carries an `i18n` key suffix (resolved under `dashboard.steps.*`)
 * plus a concrete in-app `href`, an icon name, and a `done` flag. A label-free
 * `plainTitle` / `plainDescription` mirror is included for the Copilot, which
 * builds a prompt string server-side without the next-intl client hook.
 */

export type OnboardingStepId =
  | "company-profile"
  | "first-product"
  | "classify-product"
  | "upload-sbom"
  | "triage-vulnerabilities"
  | "complete-checklist";

export interface OnboardingStep {
  id: OnboardingStepId;
  /** i18n key suffix under `dashboard.steps.<id>` (title + description). */
  id_key: OnboardingStepId;
  /** Concrete, clickable in-app path (never contains `{placeholder}`). */
  href: string;
  /** Iconsax icon name for the step badge. */
  icon: string;
  /** Whether the org has already satisfied this step. */
  done: boolean;
  /** Plain-text title for non-i18n consumers (Copilot prompt). */
  plainTitle: string;
  /** Plain-text one-liner for non-i18n consumers (Copilot prompt). */
  plainDescription: string;
}

/** Minimal slice of `DashboardStats` this module needs. */
export interface OnboardingStatsInput {
  totalProducts: number;
  assessedCount: number;
  products: { has_sbom: boolean; cra_category: string | null }[];
  openVulnCount: number;
  totalVulnerabilities: number;
  overdueCount: number;
}

export interface OnboardingProfileInput {
  complete: boolean;
}

export interface OnboardingState {
  /** Ordered steps with their done flags. */
  steps: OnboardingStep[];
  /** Count of completed steps. */
  completedCount: number;
  /** Total number of steps. */
  totalCount: number;
  /** 0-100 completion percentage (rounded). */
  progress: number;
  /** The first not-yet-done step, or `null` when everything is done. */
  nextStep: OnboardingStep | null;
  /**
   * True when the org is brand-new with essentially nothing set up — used to
   * decide whether to render the guidance screen instead of the full
   * dashboard. We treat "no products at all" as empty; once a product exists
   * the real dashboard is meaningful even if other steps remain.
   */
  isEmpty: boolean;
}

interface BuildArgs {
  stats: OnboardingStatsInput;
  profile: OnboardingProfileInput;
}

/**
 * Compute the onboarding/project state from already-fetched dashboard data.
 */
export function getOnboardingState({
  stats,
  profile,
}: BuildArgs): OnboardingState {
  const hasProduct = stats.totalProducts > 0;
  const anyClassified = stats.products.some((p) => !!p.cra_category);
  const anySbom = stats.products.some((p) => p.has_sbom);
  const hasVulns = stats.totalVulnerabilities > 0;
  const allTriaged = hasVulns && stats.openVulnCount === 0;
  const anyAssessed = stats.assessedCount > 0;

  const steps: OnboardingStep[] = [
    {
      id: "company-profile",
      id_key: "company-profile",
      href: "/app/settings",
      icon: "Building",
      done: profile.complete,
      plainTitle: "Complete your company profile",
      plainDescription:
        "Add your legal entity details so Seentrix can generate a Declaration of Conformity.",
    },
    {
      id: "first-product",
      id_key: "first-product",
      href: "/app/products?new=product",
      icon: "Box",
      done: hasProduct,
      plainTitle: "Add your first product",
      plainDescription:
        "Register a product to start tracking its CRA compliance journey.",
    },
    {
      id: "classify-product",
      id_key: "classify-product",
      href: "/app/products",
      icon: "ShieldTick",
      done: anyClassified || anyAssessed,
      plainTitle: "Classify your product under the CRA",
      plainDescription:
        "Run the guided assessment to determine the product's CRA category and conformity route.",
    },
    {
      id: "upload-sbom",
      id_key: "upload-sbom",
      href: "/app/products",
      icon: "DocumentUpload",
      done: anySbom,
      plainTitle: "Upload a Software Bill of Materials",
      plainDescription:
        "Upload a CycloneDX or SPDX SBOM so Seentrix can surface known vulnerabilities.",
    },
    {
      id: "triage-vulnerabilities",
      id_key: "triage-vulnerabilities",
      href: "/app/vulnerability-reports",
      icon: "Danger",
      done: allTriaged,
      plainTitle: "Triage your vulnerabilities",
      plainDescription:
        "Review open vulnerabilities and mark each resolved or accepted.",
    },
    {
      id: "complete-checklist",
      id_key: "complete-checklist",
      href: "/app/products",
      icon: "Verify",
      done: hasProduct && anyAssessed && stats.overdueCount === 0 && allTriaged,
      plainTitle: "Work through the conformity checklist",
      plainDescription:
        "Complete the essential-requirement checklist for each product to reach full conformity.",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const nextStep = steps.find((s) => !s.done) ?? null;

  return {
    steps,
    completedCount,
    totalCount,
    progress,
    nextStep,
    isEmpty: !hasProduct,
  };
}

/**
 * Render the onboarding state as a compact markdown block for the Copilot
 * system prompt, so "what do I do next?" answers are grounded in the org's
 * actual progress with clickable in-app links.
 */
export function onboardingStateToPromptBlock(state: OnboardingState): string {
  const lines = state.steps.map((s) => {
    const mark = s.done ? "[x]" : "[ ]";
    return `- ${mark} ${s.plainTitle} (${s.href}) — ${s.plainDescription}`;
  });
  const header =
    state.completedCount === state.totalCount
      ? `The organisation has completed all ${state.totalCount} onboarding steps.`
      : `Onboarding progress: ${state.completedCount} of ${state.totalCount} steps done (${state.progress}%). The next recommended step is "${state.nextStep?.plainTitle}" (${state.nextStep?.href}).`;
  return `${header}\n${lines.join("\n")}`;
}
