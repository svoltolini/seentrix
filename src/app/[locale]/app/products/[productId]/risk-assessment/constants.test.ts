import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  APPLICABILITY,
  STATUSES,
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RESIDUAL_LEVELS,
  REQUIREMENT_IDS,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
} from "./constants";

/**
 * These constants must stay in lockstep with the SQL CHECK constraints in
 * migration 00043. If they drift, an insert that passes client validation
 * would be rejected by Postgres (or vice-versa), so we assert the migration
 * text contains every enum value the TypeScript side believes in.
 */
const MIGRATION = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/00043_risk_assessments.sql",
  ),
  "utf8",
);

describe("risk-assessment constants ↔ migration 00043", () => {
  it("every applicability value appears in the SQL CHECK", () => {
    for (const v of APPLICABILITY) {
      expect(MIGRATION).toContain(`'${v}'`);
    }
  });

  it("every status value appears in the SQL CHECK", () => {
    for (const v of STATUSES) {
      expect(MIGRATION).toContain(`'${v}'`);
    }
  });

  it("every likelihood / impact / residual level appears in the SQL CHECK", () => {
    for (const v of [...LIKELIHOOD_LEVELS, ...IMPACT_LEVELS, ...RESIDUAL_LEVELS]) {
      expect(MIGRATION).toContain(`'${v}'`);
    }
  });
});

describe("requirement coverage", () => {
  it("covers all 21 Annex I requirements (13 + 8)", () => {
    expect(PART_I_REQUIREMENTS).toHaveLength(13);
    expect(PART_II_REQUIREMENTS).toHaveLength(8);
    expect(REQUIREMENT_IDS).toHaveLength(21);
  });

  it("has unique requirement ids", () => {
    expect(new Set(REQUIREMENT_IDS).size).toBe(REQUIREMENT_IDS.length);
  });
});
