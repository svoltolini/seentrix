import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ANNEX_VII_POINTS,
  POINT_FIX_SEGMENT,
  computeManifest,
  coverageScore,
  retentionUntil,
  type ManifestInput,
} from "./annex-vii";

const EMPTY: ManifestInput = {
  hasDescription: false,
  hasIntendedUse: false,
  releasesCount: 0,
  isHardware: false,
  hasHardwarePhoto: false,
  hasArchitectureDiagram: false,
  hasAnyDiagram: false,
  hasActiveSbom: false,
  hasVdpPolicy: false,
  hasSecurityContact: false,
  hasUpdateMechanism: false,
  hasProductionInfo: false,
  hasReleasedRiskAssessment: false,
  hasDraftRiskAssessment: false,
  hasSupportStart: false,
  hasSupportEnd: false,
  hasStandards: false,
  hasTestReports: false,
  hasOtherEvidence: false,
  docStatus: "not_started",
};

const FULL: ManifestInput = {
  hasDescription: true,
  hasIntendedUse: true,
  releasesCount: 2,
  isHardware: false,
  hasHardwarePhoto: false,
  hasArchitectureDiagram: true,
  hasAnyDiagram: true,
  hasActiveSbom: true,
  hasVdpPolicy: true,
  hasSecurityContact: true,
  hasUpdateMechanism: true,
  hasProductionInfo: true,
  hasReleasedRiskAssessment: true,
  hasDraftRiskAssessment: false,
  hasSupportStart: true,
  hasSupportEnd: true,
  hasStandards: true,
  hasTestReports: true,
  hasOtherEvidence: true,
  docStatus: "final",
};

describe("computeManifest", () => {
  it("returns all 9 Annex VII sections in canonical order", () => {
    const m = computeManifest(EMPTY);
    expect(m.map((e) => e.point)).toEqual([...ANNEX_VII_POINTS]);
  });

  it("grades a fully-populated product all present", () => {
    const m = computeManifest(FULL);
    expect(m.every((e) => e.coverage === "present")).toBe(true);
    expect(coverageScore(m).percent).toBe(100);
  });

  it("grades an empty product all missing", () => {
    const m = computeManifest(EMPTY);
    expect(m.every((e) => e.coverage === "missing")).toBe(true);
    expect(coverageScore(m)).toMatchObject({ present: 0, missing: 9, percent: 0 });
  });

  it("treats a draft risk assessment as partial, released as present", () => {
    const draft = computeManifest({ ...EMPTY, hasDraftRiskAssessment: true });
    expect(draft.find((e) => e.point === "risk_assessment")?.coverage).toBe("partial");
    const released = computeManifest({ ...EMPTY, hasReleasedRiskAssessment: true });
    expect(released.find((e) => e.point === "risk_assessment")?.coverage).toBe("present");
  });

  it("treats a draft DoC as partial, final as present", () => {
    expect(
      computeManifest({ ...EMPTY, docStatus: "draft" }).find(
        (e) => e.point === "declaration_of_conformity",
      )?.coverage,
    ).toBe("partial");
    expect(
      computeManifest({ ...EMPTY, docStatus: "final" }).find(
        (e) => e.point === "declaration_of_conformity",
      )?.coverage,
    ).toBe("present");
  });

  it("design point: a non-architecture diagram alone is partial", () => {
    const m = computeManifest({ ...EMPTY, hasAnyDiagram: true });
    expect(m.find((e) => e.point === "design_architecture")?.coverage).toBe("partial");
  });

  it("hardware products need a photo for general_description to be present", () => {
    const base = {
      ...EMPTY,
      hasDescription: true,
      hasIntendedUse: true,
      releasesCount: 1,
    };
    expect(
      computeManifest({ ...base, isHardware: true, hasHardwarePhoto: false }).find(
        (e) => e.point === "general_description",
      )?.coverage,
    ).toBe("partial");
    expect(
      computeManifest({ ...base, isHardware: true, hasHardwarePhoto: true }).find(
        (e) => e.point === "general_description",
      )?.coverage,
    ).toBe("present");
  });

  it("test_reports: only 'other' evidence is partial, a real report is present", () => {
    expect(
      computeManifest({ ...EMPTY, hasOtherEvidence: true }).find(
        (e) => e.point === "test_reports",
      )?.coverage,
    ).toBe("partial");
    expect(
      computeManifest({ ...EMPTY, hasTestReports: true }).find(
        (e) => e.point === "test_reports",
      )?.coverage,
    ).toBe("present");
  });
});

describe("coverageScore", () => {
  it("counts a partial as half a point", () => {
    const entries = computeManifest({ ...EMPTY, hasDraftRiskAssessment: true });
    // 8 missing + 1 partial → 0.5 / 9 ≈ 6%
    expect(coverageScore(entries).percent).toBe(6);
  });
});

describe("retentionUntil (Art 13(13))", () => {
  it("is 10 years after release when the support period is shorter", () => {
    const released = new Date("2026-06-08T00:00:00Z");
    const got = retentionUntil(released, new Date("2030-01-01T00:00:00Z"));
    expect(got.getUTCFullYear()).toBe(2036);
  });

  it("extends to the support-period end when that is later than 10 years", () => {
    const released = new Date("2026-06-08T00:00:00Z");
    const supportEnd = new Date("2040-01-01T00:00:00Z");
    expect(retentionUntil(released, supportEnd)).toEqual(supportEnd);
  });

  it("handles a null support period", () => {
    const released = new Date("2026-06-08T00:00:00Z");
    expect(retentionUntil(released, null).getUTCFullYear()).toBe(2036);
  });
});

describe("fix-segment map", () => {
  it("covers every point", () => {
    for (const p of ANNEX_VII_POINTS) {
      expect(POINT_FIX_SEGMENT[p]).toBeDefined();
    }
  });
});

describe("constants ↔ migration 00044", () => {
  it("technical_files status enum matches the SQL CHECK", () => {
    const sql = readFileSync(
      path.resolve(process.cwd(), "supabase/migrations/00044_technical_files.sql"),
      "utf8",
    );
    for (const v of ["draft", "released", "archived"]) {
      expect(sql).toContain(`'${v}'`);
    }
  });
});
