import { describe, it, expect } from "vitest";
import {
  PLANS,
  PLAN_PRODUCT_LIMITS,
  getProductLimit,
  canCreateProduct,
  isChecklistReadOnly,
  canUploadSbom,
  canGeneratePdf,
  canUseDocumentTemplates,
  canUseContinuousMonitoring,
  canUsePsirt,
  canUseApi,
  hasFeature,
  getPlanFromPriceId,
  PLAN_PRICES_EUR,
  isPurchasable,
  PURCHASABLE_PLANS,
  type OrgPlan,
} from "@/lib/constants/plans";

describe("product limits", () => {
  it("exposes the documented per-plan caps", () => {
    expect(PLAN_PRODUCT_LIMITS.free).toBe(1);
    expect(PLAN_PRODUCT_LIMITS.professional).toBe(3);
    expect(PLAN_PRODUCT_LIMITS.business).toBe(15);
    expect(PLAN_PRODUCT_LIMITS.enterprise).toBe(Infinity);
  });

  it("getProductLimit mirrors the limit table", () => {
    for (const plan of PLANS) {
      expect(getProductLimit(plan)).toBe(PLAN_PRODUCT_LIMITS[plan]);
    }
  });

  describe("canCreateProduct", () => {
    it("allows creation below the limit", () => {
      expect(canCreateProduct("free", 0)).toBe(true);
      expect(canCreateProduct("professional", 2)).toBe(true);
    });

    it("blocks creation at the limit", () => {
      expect(canCreateProduct("free", 1)).toBe(false);
      expect(canCreateProduct("professional", 3)).toBe(false);
      expect(canCreateProduct("business", 15)).toBe(false);
    });

    it("never blocks enterprise (unlimited)", () => {
      expect(canCreateProduct("enterprise", 9999)).toBe(true);
    });
  });
});

describe("isChecklistReadOnly", () => {
  it.each(PLANS)("is always writable on '%s' (free tier was un-gated)", (plan) => {
    expect(isChecklistReadOnly(plan)).toBe(false);
  });
});

describe("SBOM gating", () => {
  it("blocks SBOM upload entirely on free", () => {
    expect(canUploadSbom("free", 0)).toBe(false);
  });

  it("allows SBOM upload on paid plans", () => {
    expect(canUploadSbom("professional", 0)).toBe(true);
    expect(canUploadSbom("business", 100)).toBe(true);
    expect(canUploadSbom("enterprise", 9999)).toBe(true);
  });
});

describe("document / PDF gating", () => {
  it("gates PDF generation and templates behind paid plans", () => {
    expect(canGeneratePdf("free")).toBe(false);
    expect(canUseDocumentTemplates("free")).toBe(false);
    for (const plan of ["professional", "business", "enterprise"] as OrgPlan[]) {
      expect(canGeneratePdf(plan)).toBe(true);
      expect(canUseDocumentTemplates(plan)).toBe(true);
    }
  });
});

describe("business+ gating", () => {
  it.each([
    ["canUseContinuousMonitoring", canUseContinuousMonitoring],
    ["canUsePsirt", canUsePsirt],
    ["canUseApi", canUseApi],
  ] as const)("%s requires business or enterprise", (_name, fn) => {
    expect(fn("free")).toBe(false);
    expect(fn("professional")).toBe(false);
    expect(fn("business")).toBe(true);
    expect(fn("enterprise")).toBe(true);
  });
});

describe("hasFeature", () => {
  it.each(["sbom", "pdf", "documents"] as const)(
    "gates '%s' behind any paid plan",
    (feature) => {
      expect(hasFeature("free", feature)).toBe(false);
      expect(hasFeature("professional", feature)).toBe(true);
    }
  );

  it.each(["monitoring", "psirt", "api", "vex_csaf"] as const)(
    "gates '%s' behind business+",
    (feature) => {
      expect(hasFeature("professional", feature)).toBe(false);
      expect(hasFeature("business", feature)).toBe(true);
      expect(hasFeature("enterprise", feature)).toBe(true);
    }
  );

  it.each(["sso", "custom_branding", "parent_child_org"] as const)(
    "gates '%s' behind enterprise only",
    (feature) => {
      expect(hasFeature("business", feature)).toBe(false);
      expect(hasFeature("enterprise", feature)).toBe(true);
    }
  );
});

describe("getPlanFromPriceId", () => {
  it("falls back to 'free' for an unknown price id", () => {
    expect(getPlanFromPriceId("price_does_not_exist")).toBe("free");
  });

  it("falls back to 'free' for an empty string", () => {
    // In the test env the Stripe price-id env vars are unset (empty string),
    // so an empty input must NOT accidentally match an unconfigured plan.
    expect(getPlanFromPriceId("")).toBe("free");
  });
});

describe("displayed prices", () => {
  it("offers annual pricing at ~10x monthly (2 months free) on paid plans", () => {
    for (const plan of ["professional", "business", "enterprise"] as const) {
      const { monthly, annual } = PLAN_PRICES_EUR[plan];
      expect(annual).toBe(monthly * 10);
    }
  });

  it("reflects the current Professional and Business prices", () => {
    expect(PLAN_PRICES_EUR.professional).toEqual({ monthly: 59, annual: 590 });
    expect(PLAN_PRICES_EUR.business).toEqual({ monthly: 219, annual: 2190 });
  });

  it("keeps the free plan at zero", () => {
    expect(PLAN_PRICES_EUR.free).toEqual({ monthly: 0, annual: 0 });
  });
});

describe("purchasable plans", () => {
  it("marks Professional and Business as purchasable", () => {
    expect(isPurchasable("professional")).toBe(true);
    expect(isPurchasable("business")).toBe(true);
  });

  it("never lets Enterprise be checked out (coming soon)", () => {
    expect(isPurchasable("enterprise")).toBe(false);
  });

  it("treats Free as non-purchasable", () => {
    expect(isPurchasable("free")).toBe(false);
  });

  it("PURCHASABLE_PLANS contains exactly the buyable paid tiers", () => {
    expect([...PURCHASABLE_PLANS]).toEqual(["professional", "business"]);
  });
});
