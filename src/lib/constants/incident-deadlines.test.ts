import { describe, it, expect } from "vitest";
import {
  finalReportWindowHours,
  phaseWindowHours,
  phaseDeadline,
  nextPhaseDeadline,
  formatRemaining,
} from "./incident-deadlines";

describe("Article 14 phase windows", () => {
  it("early warning is 24h and notification is 72h regardless of trigger", () => {
    for (const type of ["security_incident", "exploited_vulnerability"] as const) {
      expect(phaseWindowHours("early_warning", type)).toBe(24);
      expect(phaseWindowHours("incident_report", type)).toBe(72);
    }
  });

  it("final report is 14 days for an exploited vulnerability", () => {
    expect(finalReportWindowHours("exploited_vulnerability")).toBe(14 * 24);
    expect(phaseWindowHours("final_report", "exploited_vulnerability")).toBe(336);
  });

  it("final report is 1 month (30 days) for a severe incident", () => {
    expect(finalReportWindowHours("security_incident")).toBe(30 * 24);
    expect(phaseWindowHours("final_report", "security_incident")).toBe(720);
  });
});

describe("phaseDeadline", () => {
  const aware = "2026-06-08T00:00:00.000Z";
  it("adds the right window to aware_at", () => {
    expect(phaseDeadline(aware, "early_warning", "security_incident").toISOString()).toBe(
      "2026-06-09T00:00:00.000Z",
    );
    expect(phaseDeadline(aware, "incident_report", "security_incident").toISOString()).toBe(
      "2026-06-11T00:00:00.000Z",
    );
    expect(
      phaseDeadline(aware, "final_report", "exploited_vulnerability").toISOString(),
    ).toBe("2026-06-22T00:00:00.000Z"); // +14d
    expect(
      phaseDeadline(aware, "final_report", "security_incident").toISOString(),
    ).toBe("2026-07-08T00:00:00.000Z"); // +30d
  });
});

describe("nextPhaseDeadline", () => {
  const base = {
    awareAt: "2026-06-08T00:00:00.000Z",
    type: "security_incident" as const,
  };
  it("returns the first unsubmitted phase", () => {
    expect(
      nextPhaseDeadline({
        ...base,
        earlySubmitted: false,
        notificationSubmitted: false,
        finalSubmitted: false,
      })?.phase,
    ).toBe("early_warning");
    expect(
      nextPhaseDeadline({
        ...base,
        earlySubmitted: true,
        notificationSubmitted: false,
        finalSubmitted: false,
      })?.phase,
    ).toBe("incident_report");
    expect(
      nextPhaseDeadline({
        ...base,
        earlySubmitted: true,
        notificationSubmitted: true,
        finalSubmitted: false,
      })?.phase,
    ).toBe("final_report");
  });
  it("returns null when everything is submitted", () => {
    expect(
      nextPhaseDeadline({
        ...base,
        earlySubmitted: true,
        notificationSubmitted: true,
        finalSubmitted: true,
      }),
    ).toBeNull();
  });
});

describe("formatRemaining", () => {
  it("formats days+hours and hours+minutes", () => {
    expect(formatRemaining(50 * 3_600_000)).toBe("2d 2h");
    expect(formatRemaining(3 * 3_600_000 + 30 * 60_000)).toBe("3h 30m");
  });
  it("prefixes overdue with a minus", () => {
    expect(formatRemaining(-2 * 3_600_000)).toBe("-2h 0m");
  });
});
