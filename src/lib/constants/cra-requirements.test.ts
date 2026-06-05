import { describe, it, expect } from "vitest";
import {
  calculateComplianceScore,
  parseItemDescription,
  serializeItemDescription,
  CRA_REQUIREMENTS,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  CHECKLIST_STATUSES,
  type ItemDescription,
} from "@/lib/constants/cra-requirements";

describe("calculateComplianceScore", () => {
  it("returns 100 for an empty checklist (nothing applicable)", () => {
    expect(calculateComplianceScore([])).toBe(100);
  });

  it("returns 100 when every item is not_applicable", () => {
    expect(
      calculateComplianceScore([
        { status: "not_applicable" },
        { status: "not_applicable" },
      ])
    ).toBe(100);
  });

  it("returns 0 when nothing applicable is completed", () => {
    expect(
      calculateComplianceScore([
        { status: "pending" },
        { status: "in_progress" },
      ])
    ).toBe(0);
  });

  it("returns 100 when all applicable items are completed", () => {
    expect(
      calculateComplianceScore([
        { status: "completed" },
        { status: "completed" },
      ])
    ).toBe(100);
  });

  it("excludes not_applicable items from the denominator", () => {
    // 1 completed of 2 applicable (the not_applicable item is ignored) = 50%.
    expect(
      calculateComplianceScore([
        { status: "completed" },
        { status: "pending" },
        { status: "not_applicable" },
      ])
    ).toBe(50);
  });

  it.each([
    [1, 3, 33],
    [2, 3, 67],
    [1, 6, 17],
    [5, 6, 83],
  ])("rounds %d/%d completed to %d%%", (completed, total, expected) => {
    const items = [
      ...Array.from({ length: completed }, () => ({ status: "completed" })),
      ...Array.from({ length: total - completed }, () => ({ status: "pending" })),
    ];
    expect(calculateComplianceScore(items)).toBe(expected);
  });

  it("treats unknown statuses as applicable-but-incomplete", () => {
    expect(
      calculateComplianceScore([
        { status: "completed" },
        { status: "some_future_status" },
      ])
    ).toBe(50);
  });
});

describe("parseItemDescription", () => {
  it("returns empty notes + evidence for null", () => {
    expect(parseItemDescription(null)).toEqual<ItemDescription>({
      notes: "",
      evidence: [],
    });
  });

  it("treats a plain (non-JSON) string as the notes", () => {
    expect(parseItemDescription("just a note")).toEqual<ItemDescription>({
      notes: "just a note",
      evidence: [],
    });
  });

  it("parses a structured JSON description with notes + evidence", () => {
    const raw = JSON.stringify({ notes: "see docs", evidence: ["a.pdf", "b.pdf"] });
    expect(parseItemDescription(raw)).toEqual<ItemDescription>({
      notes: "see docs",
      evidence: ["a.pdf", "b.pdf"],
    });
  });

  it("defaults evidence to [] when the JSON omits it", () => {
    expect(parseItemDescription(JSON.stringify({ notes: "x" }))).toEqual<ItemDescription>(
      { notes: "x", evidence: [] }
    );
  });

  it("coerces a non-array evidence field to []", () => {
    const raw = JSON.stringify({ notes: "x", evidence: "not-an-array" });
    expect(parseItemDescription(raw).evidence).toEqual([]);
  });

  it("falls back to raw-as-notes for JSON that lacks a notes key", () => {
    const raw = JSON.stringify({ something: "else" });
    expect(parseItemDescription(raw)).toEqual<ItemDescription>({
      notes: raw,
      evidence: [],
    });
  });
});

describe("serializeItemDescription", () => {
  it("returns plain notes when there is no evidence", () => {
    expect(serializeItemDescription({ notes: "hello", evidence: [] })).toBe("hello");
  });

  it("serializes to JSON when evidence is present", () => {
    const data: ItemDescription = { notes: "hi", evidence: ["x.pdf"] };
    expect(serializeItemDescription(data)).toBe(JSON.stringify(data));
  });

  it("round-trips through parse for the evidence case", () => {
    const data: ItemDescription = { notes: "round trip", evidence: ["e1", "e2"] };
    expect(parseItemDescription(serializeItemDescription(data))).toEqual(data);
  });

  it("round-trips through parse for the notes-only case", () => {
    const data: ItemDescription = { notes: "only notes", evidence: [] };
    expect(parseItemDescription(serializeItemDescription(data))).toEqual(data);
  });
});

describe("CRA requirement catalog integrity", () => {
  it("combines Part I and Part II into the full requirement list", () => {
    expect(CRA_REQUIREMENTS).toHaveLength(
      PART_I_REQUIREMENTS.length + PART_II_REQUIREMENTS.length
    );
  });

  it("matches the CRA Annex I structure: 13 security + 8 vulnerability-handling", () => {
    expect(PART_I_REQUIREMENTS).toHaveLength(13);
    expect(PART_II_REQUIREMENTS).toHaveLength(8);
  });

  it("has unique requirement ids", () => {
    const ids = CRA_REQUIREMENTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("labels each requirement with the correct part", () => {
    for (const r of PART_I_REQUIREMENTS) expect(r.part).toBe("part_i");
    for (const r of PART_II_REQUIREMENTS) expect(r.part).toBe("part_ii");
  });

  it("exposes the four DB-constraint checklist statuses", () => {
    expect(CHECKLIST_STATUSES).toEqual([
      "pending",
      "in_progress",
      "completed",
      "not_applicable",
    ]);
  });
});
