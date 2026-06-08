import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPPLY_RELATIONS,
  MONITORING_SOURCES,
  MONITORING_SEVERITIES,
  ADVISORY_SEVERITIES,
  TEST_TYPES,
  isTestType,
  nextDue,
} from "./constants";

const MIGRATION = readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/00047_lifecycle_supply_chain.sql"),
  "utf8",
);

describe("lifecycle constants ↔ migration 00047", () => {
  it("every enum value appears in a SQL CHECK", () => {
    for (const v of [
      ...SUPPLY_RELATIONS,
      ...MONITORING_SOURCES,
      ...MONITORING_SEVERITIES,
      ...ADVISORY_SEVERITIES,
      ...TEST_TYPES,
    ]) {
      expect(MIGRATION).toContain(`'${v}'`);
    }
  });
});

describe("validators", () => {
  it("isTestType", () => {
    expect(isTestType("fuzzing")).toBe(true);
    expect(isTestType("vibes")).toBe(false);
  });
});

describe("nextDue", () => {
  it("adds frequency days to the last-performed date", () => {
    const got = nextDue(new Date("2026-01-01T00:00:00Z"), 90);
    expect(got.toISOString().slice(0, 10)).toBe("2026-04-01");
  });
});
