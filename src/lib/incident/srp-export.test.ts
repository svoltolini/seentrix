import { describe, it, expect } from "vitest";
import {
  buildSrpReport,
  defaultSrpStage,
  srpFilenameStem,
  type SrpExportInput,
  type SrpIncident,
} from "./srp-export";

const baseIncident: SrpIncident = {
  id: "11112222-3333-4444-5555-666677778888",
  type: "exploited_vulnerability",
  severity: "critical",
  title: "CVE-2025-0001 actively exploited",
  description: "Heap overflow being exploited in the wild.",
  awareAt: "2026-06-13T00:00:00.000Z",
  linkedCveId: "CVE-2025-0001",
  earlyWarningNotes: "Initial detection; investigating scope.",
  incidentReportNotes: "Confirmed exploitation against the parser.",
  finalReportNotes: "Patched in 2.1.1; mitigation guidance published.",
  earlyWarningSubmittedAt: "2026-06-13T06:00:00.000Z",
  incidentReportSubmittedAt: null,
  finalReportSubmittedAt: null,
  userNotificationSentAt: "2026-06-13T08:00:00.000Z",
  userNotificationContent: "Please update to 2.1.1.",
  affectedProductNames: ["Acme Gateway"],
};

const input: SrpExportInput = {
  incident: baseIncident,
  manufacturer: {
    name: "Acme GmbH",
    address: "1 Acme Way, Berlin",
    contact: "security@acme.example",
    website: "https://acme.example",
  },
  stage: "early_warning",
  generatedAt: "2026-06-13T07:00:00.000Z",
};

interface SrpView {
  schema: string;
  report: {
    stage: string;
    reportType: string;
    dueBy: string;
    narrative: string | null;
    deadlines: {
      earlyWarningDueBy: string;
      notificationDueBy: string;
      finalReportDueBy: string;
    };
  };
  vulnerability: { cveId: string; activelyExploited: boolean } | null;
  affectedProducts: string[];
}

describe("buildSrpReport", () => {
  it("flags an actively-exploited-vulnerability report", () => {
    const r = buildSrpReport(input) as unknown as SrpView;
    expect(r.schema).toBe("seentrix:cra-article-14-report:1");
    expect(r.report.reportType).toBe("actively_exploited_vulnerability");
    expect(r.vulnerability?.cveId).toBe("CVE-2025-0001");
    expect(r.vulnerability?.activelyExploited).toBe(true);
    expect(r.affectedProducts).toEqual(["Acme Gateway"]);
  });

  it("computes the 24h early-warning due date from aware_at", () => {
    const r = buildSrpReport(input) as unknown as SrpView;
    expect(r.report.dueBy).toBe("2026-06-14T00:00:00.000Z"); // +24h
    expect(r.report.deadlines.notificationDueBy).toBe(
      "2026-06-16T00:00:00.000Z",
    ); // +72h
    // Exploited vuln → final report is 14 days.
    expect(r.report.deadlines.finalReportDueBy).toBe(
      "2026-06-27T00:00:00.000Z",
    );
  });

  it("uses a 1-month final window for severe incidents", () => {
    const r = buildSrpReport({
      ...input,
      incident: { ...baseIncident, type: "security_incident" },
      stage: "final_report",
    }) as unknown as SrpView;
    expect(r.report.reportType).toBe("severe_incident");
    expect(r.vulnerability).toBeNull();
    // +30 days from aware_at
    expect(r.report.deadlines.finalReportDueBy).toBe(
      "2026-07-13T00:00:00.000Z",
    );
  });

  it("surfaces the narrative for the requested stage", () => {
    const ew = buildSrpReport({ ...input, stage: "early_warning" }) as unknown as SrpView;
    expect(ew.report.narrative).toBe("Initial detection; investigating scope.");
    const fin = buildSrpReport({ ...input, stage: "final_report" }) as unknown as SrpView;
    expect(fin.report.narrative).toBe(
      "Patched in 2.1.1; mitigation guidance published.",
    );
  });
});

describe("defaultSrpStage", () => {
  it("returns the latest submitted stage", () => {
    expect(
      defaultSrpStage({
        earlyWarningSubmittedAt: "x",
        incidentReportSubmittedAt: null,
        finalReportSubmittedAt: null,
      }),
    ).toBe("early_warning");
    expect(
      defaultSrpStage({
        earlyWarningSubmittedAt: "x",
        incidentReportSubmittedAt: "y",
        finalReportSubmittedAt: null,
      }),
    ).toBe("notification");
    expect(
      defaultSrpStage({
        earlyWarningSubmittedAt: "x",
        incidentReportSubmittedAt: "y",
        finalReportSubmittedAt: "z",
      }),
    ).toBe("final_report");
  });
});

describe("srpFilenameStem", () => {
  it("builds a stable filename", () => {
    expect(
      srpFilenameStem(baseIncident.id, "early_warning", "2026-06-13T07:00:00Z"),
    ).toBe("cra-art14-early_warning-11112222-2026-06-13");
  });
});
