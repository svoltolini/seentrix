import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  daysUntil,
  daysSince,
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_HOUR,
  MS_PER_DAY,
} from "@/lib/time";

describe("time constants", () => {
  it("derives larger units from smaller ones", () => {
    expect(MS_PER_SECOND).toBe(1000);
    expect(MS_PER_MINUTE).toBe(60_000);
    expect(MS_PER_HOUR).toBe(3_600_000);
    expect(MS_PER_DAY).toBe(86_400_000);
  });
});

describe("daysUntil / daysSince", () => {
  // Pin "now" so the relative math is deterministic.
  const NOW = new Date("2026-06-05T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("daysUntil (ceil — rounds partial days up)", () => {
    it("is 0 for the current instant", () => {
      expect(daysUntil(NOW)).toBe(0);
    });

    it("rounds 23 hours from now up to 1 day", () => {
      const future = new Date(NOW.getTime() + 23 * MS_PER_HOUR);
      expect(daysUntil(future)).toBe(1);
    });

    it("counts whole future days", () => {
      const tenDays = new Date(NOW.getTime() + 10 * MS_PER_DAY);
      expect(daysUntil(tenDays)).toBe(10);
    });

    it("is negative for a past date", () => {
      const past = new Date(NOW.getTime() - 2 * MS_PER_DAY);
      expect(daysUntil(past)).toBe(-2);
    });

    it("accepts an ISO string as well as a Date", () => {
      const iso = new Date(NOW.getTime() + 5 * MS_PER_DAY).toISOString();
      expect(daysUntil(iso)).toBe(5);
    });

    it("computes the CRA reporting deadline correctly from a fixed now", () => {
      // 2026-06-05 → 2026-09-11 is 98 days.
      expect(daysUntil("2026-09-11T12:00:00Z")).toBe(98);
    });
  });

  describe("daysSince (floor, clamped at 0)", () => {
    it("is 0 for the current instant", () => {
      expect(daysSince(NOW)).toBe(0);
    });

    it("treats something 3 hours old as 0 days", () => {
      const recent = new Date(NOW.getTime() - 3 * MS_PER_HOUR);
      expect(daysSince(recent)).toBe(0);
    });

    it("counts whole elapsed days", () => {
      const old = new Date(NOW.getTime() - 7 * MS_PER_DAY);
      expect(daysSince(old)).toBe(7);
    });

    it("clamps a future date to 0 rather than going negative", () => {
      const future = new Date(NOW.getTime() + 5 * MS_PER_DAY);
      expect(daysSince(future)).toBe(0);
    });

    it("accepts an ISO string", () => {
      const iso = new Date(NOW.getTime() - 4 * MS_PER_DAY).toISOString();
      expect(daysSince(iso)).toBe(4);
    });
  });
});
