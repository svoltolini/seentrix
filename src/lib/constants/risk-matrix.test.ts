import { describe, it, expect } from "vitest";
import {
  inherentRisk,
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RISK_TONE,
  RISK_HEX,
  type RiskBand,
} from "./risk-matrix";

describe("inherentRisk 3×3 heat-map", () => {
  // The full truth table from the heat-map comment.
  const cases: Array<[(typeof LIKELIHOOD_LEVELS)[number], (typeof IMPACT_LEVELS)[number], RiskBand]> = [
    ["low", "low", "low"],
    ["low", "medium", "low"],
    ["low", "high", "medium"],
    ["medium", "low", "low"],
    ["medium", "medium", "medium"],
    ["medium", "high", "high"],
    ["high", "low", "medium"],
    ["high", "medium", "high"],
    ["high", "high", "critical"],
  ];

  for (const [likelihood, impact, expected] of cases) {
    it(`${likelihood} × ${impact} → ${expected}`, () => {
      expect(inherentRisk(likelihood, impact)).toBe(expected);
    });
  }

  it("is symmetric in likelihood/impact", () => {
    for (const a of LIKELIHOOD_LEVELS) {
      for (const b of IMPACT_LEVELS) {
        expect(inherentRisk(a, b)).toBe(inherentRisk(b, a));
      }
    }
  });

  it("never produces an out-of-vocabulary band", () => {
    const valid = new Set(["low", "medium", "high", "critical"]);
    for (const a of LIKELIHOOD_LEVELS) {
      for (const b of IMPACT_LEVELS) {
        expect(valid.has(inherentRisk(a, b))).toBe(true);
      }
    }
  });
});

describe("risk tone + hex tables", () => {
  it("cover every band", () => {
    for (const band of ["low", "medium", "high", "critical"] as RiskBand[]) {
      expect(RISK_TONE[band]).toBeTruthy();
      expect(RISK_HEX[band]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
