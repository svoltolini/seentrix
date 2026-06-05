import { describe, it, expect } from "vitest";
import {
  isChecklistComplete,
  hasScannedActiveSbom,
  type SbomGateRow,
} from "./gate";

describe("isChecklistComplete (DoC gate)", () => {
  it("is false when there are no assessable items", () => {
    expect(isChecklistComplete(0, 0)).toBe(false);
  });

  it("is false for a null/empty checklist", () => {
    expect(isChecklistComplete(null, null)).toBe(false);
  });

  it("is false when some assessable items are incomplete", () => {
    expect(isChecklistComplete(5, 3)).toBe(false);
  });

  it("is true when every assessable item is completed", () => {
    expect(isChecklistComplete(5, 5)).toBe(true);
  });

  it("treats a null completedCount as zero", () => {
    expect(isChecklistComplete(3, null)).toBe(false);
  });

  it("never reports complete for an all-not-applicable checklist (assessable=0)", () => {
    // assessableCount excludes not_applicable; 0 assessable must not pass
    // even though completedCount could be 0 too.
    expect(isChecklistComplete(0, 0)).toBe(false);
  });
});

describe("hasScannedActiveSbom (DoC gate)", () => {
  it("is false for no SBOMs", () => {
    expect(hasScannedActiveSbom([])).toBe(false);
    expect(hasScannedActiveSbom(null)).toBe(false);
  });

  it("is false when active SBOMs exist but none have been scanned", () => {
    const sboms: SbomGateRow[] = [
      { last_scanned_at: null },
      { last_scanned_at: null },
    ];
    expect(hasScannedActiveSbom(sboms)).toBe(false);
  });

  it("is true when at least one active SBOM has been scanned", () => {
    const sboms: SbomGateRow[] = [
      { last_scanned_at: null },
      { last_scanned_at: "2026-06-01T10:00:00Z" },
    ];
    expect(hasScannedActiveSbom(sboms)).toBe(true);
  });
});
