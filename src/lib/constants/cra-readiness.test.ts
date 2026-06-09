import { describe, it, expect } from "vitest";
import {
  READINESS_ITEMS,
  READINESS_GROUPS,
  computeReadiness,
  readinessScore,
  type ReadinessInput,
} from "./cra-readiness";

const EMPTY: ReadinessInput = {
  annexIComplete: false,
  annexIStarted: false,
  hasActiveSbom: false,
  raReleased: false,
  raDraft: false,
  hasArchitectureDiagram: false,
  hasAnyDiagram: false,
  techFileReleased: false,
  techFileDraft: false,
  docFinal: false,
  docDraft: false,
  ceRecorded: false,
  identitySet: false,
  userInfoComplete: false,
  userInfoPartial: false,
  monitoringCount: 0,
  securityTestCount: 0,
  hasVdpPolicy: false,
  hasSecurityContact: false,
  advisoryCount: 0,
  supplyChainCount: 0,
  hasSupportStart: false,
  hasSupportEnd: false,
  hasEndOfSupportPlan: false,
};

const FULL: ReadinessInput = {
  annexIComplete: true,
  annexIStarted: true,
  hasActiveSbom: true,
  raReleased: true,
  raDraft: false,
  hasArchitectureDiagram: true,
  hasAnyDiagram: true,
  techFileReleased: true,
  techFileDraft: false,
  docFinal: true,
  docDraft: false,
  ceRecorded: true,
  identitySet: true,
  userInfoComplete: true,
  userInfoPartial: false,
  monitoringCount: 3,
  securityTestCount: 2,
  hasVdpPolicy: true,
  hasSecurityContact: true,
  advisoryCount: 1,
  supplyChainCount: 4,
  hasSupportStart: true,
  hasSupportEnd: true,
  hasEndOfSupportPlan: true,
};

describe("computeReadiness", () => {
  it("grades every master-checklist item", () => {
    const items = computeReadiness(EMPTY);
    expect(items).toHaveLength(READINESS_ITEMS.length);
    expect(items.every((x) => x.status === "missing")).toBe(true);
  });

  it("a fully-populated product is 100%", () => {
    const items = computeReadiness(FULL);
    expect(items.every((x) => x.status === "complete")).toBe(true);
    expect(readinessScore(items).percent).toBe(100);
  });

  it("an empty product is 0%", () => {
    expect(readinessScore(computeReadiness(EMPTY)).percent).toBe(0);
  });

  it("draft risk assessment / DoC count as partial", () => {
    const items = computeReadiness({ ...EMPTY, raDraft: true, docDraft: true });
    expect(items.find((x) => x.key === "risk_assessment")?.status).toBe("partial");
    expect(items.find((x) => x.key === "declaration")?.status).toBe("partial");
  });

  it("incident readiness is partial with only one of VDP / contact", () => {
    expect(
      computeReadiness({ ...EMPTY, hasVdpPolicy: true }).find(
        (x) => x.key === "incident_readiness",
      )?.status,
    ).toBe("partial");
    expect(
      computeReadiness({ ...EMPTY, hasVdpPolicy: true, hasSecurityContact: true }).find(
        (x) => x.key === "incident_readiness",
      )?.status,
    ).toBe("complete");
  });

  it("every item belongs to a known group and has a fix segment", () => {
    for (const item of READINESS_ITEMS) {
      expect(READINESS_GROUPS).toContain(item.group);
      expect(typeof item.fixSegment).toBe("string");
    }
  });
});

describe("readinessScore", () => {
  it("counts a partial as half", () => {
    // 1 complete + 1 partial, rest missing → (1 + 0.5) / 17
    const items = computeReadiness({ ...EMPTY, hasActiveSbom: true, raDraft: true });
    const score = readinessScore(items);
    expect(score.complete).toBe(1);
    expect(score.partial).toBe(1);
    expect(score.percent).toBe(Math.round((1.5 / 17) * 100));
  });
});
