import { describe, it, expect } from "vitest";
import {
  toCsafProductStatus,
  toVexState,
  csafRemediationCategory,
  vexResponses,
} from "./status-map";
import type { AdvisoryVulnerability } from "./types";

type Triage = Pick<AdvisoryVulnerability, "status" | "resolutionType">;

describe("toCsafProductStatus", () => {
  it("maps open → under_investigation", () => {
    expect(toCsafProductStatus({ status: "open", resolutionType: null })).toBe(
      "under_investigation",
    );
  });

  it("maps in_progress → known_affected", () => {
    expect(
      toCsafProductStatus({ status: "in_progress", resolutionType: null }),
    ).toBe("known_affected");
  });

  it("maps resolved+fix → fixed", () => {
    expect(
      toCsafProductStatus({ status: "resolved", resolutionType: "fix" }),
    ).toBe("fixed");
  });

  it("maps false_positive → known_not_affected", () => {
    expect(
      toCsafProductStatus({
        status: "resolved",
        resolutionType: "false_positive",
      }),
    ).toBe("known_not_affected");
  });

  it("keeps mitigation/wont_fix as known_affected", () => {
    expect(
      toCsafProductStatus({ status: "resolved", resolutionType: "mitigation" }),
    ).toBe("known_affected");
    expect(
      toCsafProductStatus({ status: "accepted", resolutionType: "wont_fix" }),
    ).toBe("known_affected");
  });

  it("defaults resolved(no type) → fixed, accepted(no type) → known_affected", () => {
    expect(
      toCsafProductStatus({ status: "resolved", resolutionType: null }),
    ).toBe("fixed");
    expect(
      toCsafProductStatus({ status: "accepted", resolutionType: null }),
    ).toBe("known_affected");
  });
});

describe("toVexState", () => {
  const cases: Array<[Triage, string]> = [
    [{ status: "open", resolutionType: null }, "in_triage"],
    [{ status: "in_progress", resolutionType: null }, "exploitable"],
    [{ status: "resolved", resolutionType: "fix" }, "resolved"],
    [{ status: "resolved", resolutionType: "false_positive" }, "not_affected"],
    [{ status: "resolved", resolutionType: "mitigation" }, "exploitable"],
    [{ status: "accepted", resolutionType: "wont_fix" }, "exploitable"],
  ];
  it.each(cases)("maps %o → %s", (triage, expected) => {
    expect(toVexState(triage)).toBe(expected);
  });
});

describe("csafRemediationCategory", () => {
  it("returns vendor_fix for fixed", () => {
    expect(
      csafRemediationCategory({ status: "resolved", resolutionType: "fix" }),
    ).toBe("vendor_fix");
  });
  it("returns mitigation / none_available", () => {
    expect(
      csafRemediationCategory({
        status: "resolved",
        resolutionType: "mitigation",
      }),
    ).toBe("mitigation");
    expect(
      csafRemediationCategory({ status: "accepted", resolutionType: "wont_fix" }),
    ).toBe("none_available");
  });
  it("returns null when under investigation", () => {
    expect(
      csafRemediationCategory({ status: "open", resolutionType: null }),
    ).toBeNull();
  });
});

describe("vexResponses", () => {
  it("maps resolution types to responses", () => {
    expect(vexResponses({ status: "resolved", resolutionType: "fix" })).toEqual(
      ["update"],
    );
    expect(
      vexResponses({ status: "resolved", resolutionType: "mitigation" }),
    ).toEqual(["workaround_available"]);
    expect(
      vexResponses({ status: "accepted", resolutionType: "wont_fix" }),
    ).toEqual(["will_not_fix"]);
    expect(vexResponses({ status: "open", resolutionType: null })).toEqual([]);
  });
});
