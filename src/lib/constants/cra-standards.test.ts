import { describe, it, expect } from "vitest";
import {
  CRA_STANDARDS,
  requirementsCoveredBy,
  presumptionCoverage,
  standardsForRequirement,
} from "./cra-standards";
import { CRA_REQUIREMENTS } from "./cra-requirements";

const REQ_IDS = new Set(CRA_REQUIREMENTS.map((r) => r.id));

describe("CRA_STANDARDS catalogue", () => {
  it("every explicit requirement mapping references a real Annex I id", () => {
    for (const s of CRA_STANDARDS) {
      for (const id of s.coversRequirementIds) {
        expect(REQ_IDS.has(id), `${s.id} → ${id}`).toBe(true);
      }
    }
  });

  it("has at least one published baseline and the M/606 horizontals", () => {
    expect(CRA_STANDARDS.some((s) => s.status === "published")).toBe(true);
    expect(CRA_STANDARDS.some((s) => s.id === "cra_horizontal_product")).toBe(
      true,
    );
    expect(
      CRA_STANDARDS.some((s) => s.id === "cra_horizontal_vuln_handling"),
    ).toBe(true);
  });
});

describe("requirementsCoveredBy", () => {
  it("expands an empty mapping to all requirements in the covered parts", () => {
    const horiz = CRA_STANDARDS.find((s) => s.id === "cra_horizontal_product")!;
    const covered = requirementsCoveredBy(horiz);
    const partI = CRA_REQUIREMENTS.filter((r) => r.part === "part_i");
    expect(covered).toHaveLength(partI.length);
    expect(covered).toContain("secure_by_design");
    // Part I standard must not leak Part II requirements.
    expect(covered).not.toContain("sbom_maintenance");
  });

  it("uses the explicit list when present", () => {
    const en1 = CRA_STANDARDS.find((s) => s.id === "en_18031_1")!;
    expect(requirementsCoveredBy(en1)).toContain("secure_default_config");
    expect(requirementsCoveredBy(en1)).not.toContain("data_minimization");
  });
});

describe("presumptionCoverage", () => {
  it("excludes in-development standards by default", () => {
    // The horizontal product standard is in_development → no presumption yet.
    const covered = presumptionCoverage(["cra_horizontal_product"]);
    expect(covered.size).toBe(0);
  });

  it("includes published standards", () => {
    const covered = presumptionCoverage(["en_18031_1"]);
    expect(covered.has("secure_default_config")).toBe(true);
  });

  it("can include unpublished standards when asked (planning view)", () => {
    const covered = presumptionCoverage(["cra_horizontal_product"], {
      includeUnpublished: true,
    });
    expect(covered.has("secure_by_design")).toBe(true);
  });
});

describe("standardsForRequirement", () => {
  it("finds the standards covering a Part II requirement", () => {
    const list = standardsForRequirement("sbom_maintenance");
    expect(list.some((s) => s.id === "cra_horizontal_vuln_handling")).toBe(true);
    // A Part I-only baseline should not appear.
    expect(list.some((s) => s.id === "en_18031_1")).toBe(false);
  });
});
