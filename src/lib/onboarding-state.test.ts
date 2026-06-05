import { describe, it, expect } from "vitest";
import {
  getOnboardingState,
  onboardingStateToPromptBlock,
  type OnboardingStatsInput,
  type OnboardingProfileInput,
} from "./onboarding-state";

function makeStats(
  overrides: Partial<OnboardingStatsInput> = {},
): OnboardingStatsInput {
  return {
    totalProducts: 0,
    assessedCount: 0,
    products: [],
    openVulnCount: 0,
    totalVulnerabilities: 0,
    overdueCount: 0,
    ...overrides,
  };
}

const incompleteProfile: OnboardingProfileInput = { complete: false };
const completeProfile: OnboardingProfileInput = { complete: true };

describe("getOnboardingState", () => {
  it("flags a brand-new org with nothing set up as empty", () => {
    const state = getOnboardingState({
      stats: makeStats(),
      profile: incompleteProfile,
    });
    expect(state.isEmpty).toBe(true);
    expect(state.completedCount).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.nextStep?.id).toBe("company-profile");
  });

  it("is no longer empty once a product exists", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        products: [{ has_sbom: false, cra_category: null }],
      }),
      profile: incompleteProfile,
    });
    expect(state.isEmpty).toBe(false);
  });

  it("marks the company-profile step done when the profile is complete", () => {
    const state = getOnboardingState({
      stats: makeStats(),
      profile: completeProfile,
    });
    const step = state.steps.find((s) => s.id === "company-profile");
    expect(step?.done).toBe(true);
    expect(state.completedCount).toBe(1);
    // first-product is the next outstanding step
    expect(state.nextStep?.id).toBe("first-product");
  });

  it("marks classify done when a product has a cra_category", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        products: [{ has_sbom: false, cra_category: "important_class_i" }],
      }),
      profile: incompleteProfile,
    });
    expect(state.steps.find((s) => s.id === "classify-product")?.done).toBe(
      true,
    );
  });

  it("marks classify done when assessedCount > 0 even without category", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        assessedCount: 1,
        products: [{ has_sbom: false, cra_category: null }],
      }),
      profile: incompleteProfile,
    });
    expect(state.steps.find((s) => s.id === "classify-product")?.done).toBe(
      true,
    );
  });

  it("marks upload-sbom done when any product has an SBOM", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        products: [{ has_sbom: true, cra_category: null }],
      }),
      profile: incompleteProfile,
    });
    expect(state.steps.find((s) => s.id === "upload-sbom")?.done).toBe(true);
  });

  it("only marks triage done when there are vulns and none are open", () => {
    const noVulns = getOnboardingState({
      stats: makeStats({ totalProducts: 1, totalVulnerabilities: 0 }),
      profile: incompleteProfile,
    });
    expect(noVulns.steps.find((s) => s.id === "triage-vulnerabilities")?.done).toBe(
      false,
    );

    const openVulns = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        totalVulnerabilities: 5,
        openVulnCount: 3,
      }),
      profile: incompleteProfile,
    });
    expect(
      openVulns.steps.find((s) => s.id === "triage-vulnerabilities")?.done,
    ).toBe(false);

    const triaged = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        totalVulnerabilities: 5,
        openVulnCount: 0,
      }),
      profile: incompleteProfile,
    });
    expect(
      triaged.steps.find((s) => s.id === "triage-vulnerabilities")?.done,
    ).toBe(true);
  });

  it("computes 100% progress and null nextStep when all steps are done", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        assessedCount: 1,
        products: [{ has_sbom: true, cra_category: "critical" }],
        totalVulnerabilities: 2,
        openVulnCount: 0,
        overdueCount: 0,
      }),
      profile: completeProfile,
    });
    expect(state.completedCount).toBe(state.totalCount);
    expect(state.progress).toBe(100);
    expect(state.nextStep).toBeNull();
  });

  it("never emits a href with a placeholder segment", () => {
    const state = getOnboardingState({
      stats: makeStats(),
      profile: incompleteProfile,
    });
    for (const step of state.steps) {
      expect(step.href).not.toMatch(/\{.*\}/);
      expect(step.href.startsWith("/app/")).toBe(true);
    }
  });
});

describe("onboardingStateToPromptBlock", () => {
  it("includes a checklist with hrefs and the next-step header", () => {
    const state = getOnboardingState({
      stats: makeStats(),
      profile: incompleteProfile,
    });
    const block = onboardingStateToPromptBlock(state);
    expect(block).toContain("Onboarding progress: 0 of 6");
    expect(block).toContain("/app/settings");
    expect(block).toContain("[ ]");
  });

  it("reports completion when every step is done", () => {
    const state = getOnboardingState({
      stats: makeStats({
        totalProducts: 1,
        assessedCount: 1,
        products: [{ has_sbom: true, cra_category: "critical" }],
        totalVulnerabilities: 1,
        openVulnCount: 0,
      }),
      profile: completeProfile,
    });
    const block = onboardingStateToPromptBlock(state);
    expect(block).toContain("completed all 6 onboarding steps");
  });
});
