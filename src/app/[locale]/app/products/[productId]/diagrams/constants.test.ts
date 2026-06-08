import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DIAGRAM_TYPES,
  EVIDENCE_CATEGORIES,
  EVIDENCE_ALLOWED_MIMES,
  EVIDENCE_MAX_BYTES,
  DIAGRAM_ASSET_MAX_BYTES,
  ANNEX_VII_POINTS,
} from "./constants";

/**
 * These constants must stay in lockstep with the SQL CHECK constraints and
 * storage-bucket allowlists in migration 00042. If they drift, an insert that
 * passes the client validation will be rejected by Postgres (or vice-versa),
 * so we assert the migration text contains every value the TypeScript side
 * believes in.
 */
const MIGRATION = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/00042_product_diagrams_evidence.sql",
  ),
  "utf8",
);

describe("diagrams constants ↔ migration 00042", () => {
  it("every diagram type appears in the SQL type CHECK", () => {
    for (const type of DIAGRAM_TYPES) {
      expect(MIGRATION).toContain(`'${type}'`);
    }
  });

  it("every evidence category appears in the SQL category CHECK", () => {
    for (const category of EVIDENCE_CATEGORIES) {
      expect(MIGRATION).toContain(`'${category}'`);
    }
  });

  it("every allowed evidence MIME appears in the bucket allowlist", () => {
    for (const mime of EVIDENCE_ALLOWED_MIMES) {
      expect(MIGRATION).toContain(`'${mime}'`);
    }
  });

  it("the evidence size cap matches the product-evidence bucket cap", () => {
    expect(EVIDENCE_MAX_BYTES).toBe(25 * 1024 * 1024);
    expect(MIGRATION).toContain(String(EVIDENCE_MAX_BYTES)); // 26214400
  });

  it("the diagram asset cap matches the product-diagrams bucket cap", () => {
    expect(DIAGRAM_ASSET_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(MIGRATION).toContain(String(DIAGRAM_ASSET_MAX_BYTES)); // 10485760
  });
});

describe("diagrams constants — internal invariants", () => {
  it("has no duplicate diagram types or evidence categories", () => {
    expect(new Set(DIAGRAM_TYPES).size).toBe(DIAGRAM_TYPES.length);
    expect(new Set(EVIDENCE_CATEGORIES).size).toBe(EVIDENCE_CATEGORIES.length);
  });

  it("suggested Annex VII points are non-empty and unique", () => {
    expect(ANNEX_VII_POINTS.length).toBeGreaterThan(0);
    expect(new Set(ANNEX_VII_POINTS).size).toBe(ANNEX_VII_POINTS.length);
  });
});
