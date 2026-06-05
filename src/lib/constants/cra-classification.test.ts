import { describe, it, expect } from "vitest";
import {
  classifyProduct,
  ALL_SUBCATEGORIES,
  IMPORTANT_CLASS_I,
  IMPORTANT_CLASS_II,
  CRITICAL,
  EXCLUDED_SECTORS,
  SUBCATEGORY_GROUPS,
  type ClassificationResult,
} from "@/lib/constants/cra-classification";

describe("classifyProduct", () => {
  describe("default class (no/unknown subcategory)", () => {
    it("returns default + self-assessment when subcategory is null", () => {
      expect(classifyProduct(null)).toEqual<ClassificationResult>({
        category: "default",
        conformityRoute: "module_a",
        requiresNotifiedBody: false,
      });
    });

    it("returns default for an unrecognized subcategory id", () => {
      expect(classifyProduct("not_a_real_category")).toEqual<ClassificationResult>({
        category: "default",
        conformityRoute: "module_a",
        requiresNotifiedBody: false,
      });
    });

    it("treats an empty string as default (falsy id)", () => {
      expect(classifyProduct("")).toEqual<ClassificationResult>({
        category: "default",
        conformityRoute: "module_a",
        requiresNotifiedBody: false,
      });
    });
  });

  describe("Important Class I (Annex III) — self-assessment allowed", () => {
    it.each(IMPORTANT_CLASS_I.map((s) => s.id))(
      "classifies '%s' as important_class_i via module_a without a notified body",
      (id) => {
        expect(classifyProduct(id)).toEqual<ClassificationResult>({
          category: "important_class_i",
          conformityRoute: "module_a",
          requiresNotifiedBody: false,
        });
      }
    );
  });

  describe("Important Class II (Annex III) — notified body required", () => {
    it.each(IMPORTANT_CLASS_II.map((s) => s.id))(
      "classifies '%s' as important_class_ii via module_h with a notified body",
      (id) => {
        expect(classifyProduct(id)).toEqual<ClassificationResult>({
          category: "important_class_ii",
          conformityRoute: "module_h",
          requiresNotifiedBody: true,
        });
      }
    );
  });

  describe("Critical (Annex IV) — European certification", () => {
    it.each(CRITICAL.map((s) => s.id))(
      "classifies '%s' as critical via european_certification with a notified body",
      (id) => {
        expect(classifyProduct(id)).toEqual<ClassificationResult>({
          category: "critical",
          conformityRoute: "european_certification",
          requiresNotifiedBody: true,
        });
      }
    );
  });

  describe("notified-body invariant", () => {
    it("requires a notified body for exactly the higher-risk categories", () => {
      for (const sub of ALL_SUBCATEGORIES) {
        const result = classifyProduct(sub.id);
        const expected =
          sub.category === "important_class_ii" || sub.category === "critical";
        expect(result.requiresNotifiedBody).toBe(expected);
      }
    });

    it("never requires a notified body for default products", () => {
      expect(classifyProduct(null).requiresNotifiedBody).toBe(false);
    });
  });
});

describe("classification data integrity", () => {
  it("has unique subcategory ids across all annexes", () => {
    const ids = ALL_SUBCATEGORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("combines exactly the three annex lists into ALL_SUBCATEGORIES", () => {
    expect(ALL_SUBCATEGORIES).toHaveLength(
      IMPORTANT_CLASS_I.length + IMPORTANT_CLASS_II.length + CRITICAL.length
    );
  });

  it("tags every subcategory with its declared category", () => {
    for (const s of IMPORTANT_CLASS_I) expect(s.category).toBe("important_class_i");
    for (const s of IMPORTANT_CLASS_II) expect(s.category).toBe("important_class_ii");
    for (const s of CRITICAL) expect(s.category).toBe("critical");
  });

  it("only uses groups declared in SUBCATEGORY_GROUPS", () => {
    const allowed = new Set<string>(SUBCATEGORY_GROUPS);
    for (const s of ALL_SUBCATEGORIES) {
      expect(allowed.has(s.group)).toBe(true);
    }
  });

  it("lists the Article 2 excluded sectors", () => {
    expect(EXCLUDED_SECTORS).toContain("medical_devices");
    expect(EXCLUDED_SECTORS).toContain("motor_vehicles");
    expect(EXCLUDED_SECTORS).toContain("aviation");
    // Excluded sectors must not leak into the classifiable subcategory list.
    const subIds = new Set(ALL_SUBCATEGORIES.map((s) => s.id));
    for (const sector of EXCLUDED_SECTORS) {
      expect(subIds.has(sector)).toBe(false);
    }
  });
});
