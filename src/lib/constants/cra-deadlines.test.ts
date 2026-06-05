import { describe, it, expect } from "vitest";
import {
  CRA_DEADLINES,
  upcomingCraDeadlines,
  nextCraDeadline,
} from "./cra-deadlines";

describe("cra-deadlines", () => {
  it("defines the three statutory CRA milestones in date order", () => {
    expect(CRA_DEADLINES.map((d) => d.id)).toEqual([
      "notified-bodies",
      "reporting",
      "full-compliance",
    ]);
  });

  it("drops deadlines that have already passed", () => {
    const now = new Date("2026-07-01T00:00:00Z"); // after notified-bodies
    const upcoming = upcomingCraDeadlines(now);
    expect(upcoming.map((d) => d.id)).toEqual(["reporting", "full-compliance"]);
  });

  it("returns all three when before the first milestone", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(upcomingCraDeadlines(now)).toHaveLength(3);
  });

  it("nextCraDeadline returns the soonest future milestone", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    expect(nextCraDeadline(now)?.id).toBe("reporting");
  });

  it("nextCraDeadline returns null once all milestones have passed", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    expect(nextCraDeadline(now)).toBeNull();
  });
});
