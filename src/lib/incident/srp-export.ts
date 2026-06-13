/**
 * Build a structured, machine-readable Article 14 report for a CRA incident.
 *
 * ENISA's Single Reporting Platform (Art 16) is the single entry point for
 * the early-warning / notification / final-report submissions, but its
 * machine API is not public until it goes live (11 Sep 2026). Until then the
 * pragmatic deliverable is a clean JSON capturing the Art 14 notification
 * content, mirroring the SRP's expected fields, that a manufacturer can keep
 * on file and transcribe / upload. When the SRP publishes a schema this
 * becomes the payload for a direct connector.
 *
 * Pure + deterministic (caller passes `generatedAt`) so it is unit-testable.
 */

import {
  phaseDeadline,
  type IncidentPhaseKey,
  type IncidentReportType,
} from "@/lib/constants/incident-deadlines";

/** The three Art 14 stages, in the SRP's vocabulary. */
export type SrpStage = "early_warning" | "notification" | "final_report";

export interface SrpIncident {
  id: string;
  type: IncidentReportType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string | null;
  awareAt: string;
  linkedCveId: string | null;
  earlyWarningNotes: string | null;
  incidentReportNotes: string | null;
  finalReportNotes: string | null;
  earlyWarningSubmittedAt: string | null;
  incidentReportSubmittedAt: string | null;
  finalReportSubmittedAt: string | null;
  userNotificationSentAt: string | null;
  userNotificationContent: string | null;
  affectedProductNames: string[];
}

export interface SrpManufacturer {
  name: string;
  address?: string | null;
  contact?: string | null;
  website?: string | null;
}

export interface SrpExportInput {
  incident: SrpIncident;
  manufacturer: SrpManufacturer;
  stage: SrpStage;
  generatedAt: string;
}

const STAGE_TO_PHASE: Record<SrpStage, IncidentPhaseKey> = {
  early_warning: "early_warning",
  notification: "incident_report",
  final_report: "final_report",
};

/** The body text the manufacturer recorded for the requested stage. */
function stageNarrative(inc: SrpIncident, stage: SrpStage): string | null {
  if (stage === "early_warning") return inc.earlyWarningNotes;
  if (stage === "notification") return inc.incidentReportNotes;
  return inc.finalReportNotes;
}

function stageSubmittedAt(inc: SrpIncident, stage: SrpStage): string | null {
  if (stage === "early_warning") return inc.earlyWarningSubmittedAt;
  if (stage === "notification") return inc.incidentReportSubmittedAt;
  return inc.finalReportSubmittedAt;
}

export function buildSrpReport(input: SrpExportInput): Record<string, unknown> {
  const { incident: inc, manufacturer, stage, generatedAt } = input;
  const phase = STAGE_TO_PHASE[stage];

  const reportType =
    inc.type === "exploited_vulnerability"
      ? "actively_exploited_vulnerability"
      : "severe_incident";

  return {
    schema: "seentrix:cra-article-14-report:1",
    generator: { name: "Seentrix", version: "1.0", generatedAt },
    report: {
      stage,
      reportType,
      reference: inc.id,
      awareAt: inc.awareAt,
      submittedAt: stageSubmittedAt(inc, stage),
      narrative: stageNarrative(inc, stage),
      // Statutory due-by for this stage, from aware_at (Art 14).
      dueBy: phaseDeadline(inc.awareAt, phase, inc.type).toISOString(),
      deadlines: {
        earlyWarningDueBy: phaseDeadline(
          inc.awareAt,
          "early_warning",
          inc.type,
        ).toISOString(),
        notificationDueBy: phaseDeadline(
          inc.awareAt,
          "incident_report",
          inc.type,
        ).toISOString(),
        finalReportDueBy: phaseDeadline(
          inc.awareAt,
          "final_report",
          inc.type,
        ).toISOString(),
      },
    },
    manufacturer: {
      name: manufacturer.name,
      address: manufacturer.address ?? null,
      contact: manufacturer.contact ?? null,
      website: manufacturer.website ?? null,
    },
    affectedProducts: inc.affectedProductNames,
    vulnerability:
      reportType === "actively_exploited_vulnerability"
        ? { cveId: inc.linkedCveId, activelyExploited: true }
        : null,
    incident: {
      title: inc.title,
      severity: inc.severity,
      description: inc.description,
      type: inc.type,
    },
    correctiveOrMitigatingMeasures: inc.finalReportNotes,
    userNotification: {
      // Art 14(8): where appropriate, inform affected users + mitigations.
      sentAt: inc.userNotificationSentAt,
      content: inc.userNotificationContent,
    },
    // Not captured by Seentrix — the filer completes these in the SRP.
    memberStatesConcerned: [],
    routing: {
      destination: "ENISA Single Reporting Platform (Art 16)",
      recipients: ["coordinating CSIRT", "ENISA"],
    },
  };
}

/** Pick a default stage from what's already been submitted (latest first). */
export function defaultSrpStage(inc: {
  finalReportSubmittedAt: string | null;
  incidentReportSubmittedAt: string | null;
  earlyWarningSubmittedAt: string | null;
}): SrpStage {
  if (inc.finalReportSubmittedAt) return "final_report";
  if (inc.incidentReportSubmittedAt) return "notification";
  return "early_warning";
}

export function srpFilenameStem(
  incidentId: string,
  stage: SrpStage,
  generatedAt: string,
): string {
  const date = generatedAt.slice(0, 10);
  return `cra-art14-${stage}-${incidentId.slice(0, 8)}-${date}`;
}
