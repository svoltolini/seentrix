/**
 * Article 14 reporting deadlines (CRA Phase 4).
 *
 * The clock starts when the manufacturer becomes aware (`aware_at`). Three
 * windows follow — and the final-report window is TRIGGER-DEPENDENT, which is
 * the correctness fix this module centralises:
 *
 *   - early warning      ≤ 24 hours
 *   - intermediate report ≤ 72 hours
 *   - final report:
 *       · actively-exploited vulnerability → ≤ 14 days
 *       · severe security incident         → ≤ 1 month (30 days)
 *
 * Previously the UI hard-coded 14 days for the final report regardless of
 * trigger. Everything (detail rings, list countdown, dashboard widget, the
 * Copilot deadlines tool) now derives windows from here so they stay in sync.
 */

export type IncidentReportType = "security_incident" | "exploited_vulnerability";
export type IncidentPhaseKey =
  | "early_warning"
  | "incident_report"
  | "final_report";

const EARLY_WARNING_HOURS = 24;
const NOTIFICATION_HOURS = 72;
const VULN_FINAL_DAYS = 14; // exploited vulnerability
const INCIDENT_FINAL_DAYS = 30; // severe incident — "1 month"

export function finalReportWindowHours(type: IncidentReportType): number {
  return (
    (type === "exploited_vulnerability" ? VULN_FINAL_DAYS : INCIDENT_FINAL_DAYS) *
    24
  );
}

export function phaseWindowHours(
  phase: IncidentPhaseKey,
  type: IncidentReportType,
): number {
  if (phase === "early_warning") return EARLY_WARNING_HOURS;
  if (phase === "incident_report") return NOTIFICATION_HOURS;
  return finalReportWindowHours(type);
}

export function phaseDeadline(
  awareAt: Date | string,
  phase: IncidentPhaseKey,
  type: IncidentReportType,
): Date {
  const base = typeof awareAt === "string" ? new Date(awareAt) : awareAt;
  return new Date(base.getTime() + phaseWindowHours(phase, type) * 3_600_000);
}

/** First unsubmitted phase + its deadline, or null when all are submitted. */
export function nextPhaseDeadline(opts: {
  awareAt: string;
  type: IncidentReportType;
  earlySubmitted: boolean;
  notificationSubmitted: boolean;
  finalSubmitted: boolean;
}): { phase: IncidentPhaseKey; at: Date } | null {
  const order: [IncidentPhaseKey, boolean][] = [
    ["early_warning", opts.earlySubmitted],
    ["incident_report", opts.notificationSubmitted],
    ["final_report", opts.finalSubmitted],
  ];
  for (const [phase, done] of order) {
    if (!done) return { phase, at: phaseDeadline(opts.awareAt, phase, opts.type) };
  }
  return null;
}

/** Format a remaining-ms value as "Xd Yh" / "Xh Ym", with "-" when overdue. */
export function formatRemaining(ms: number): string {
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3_600_000);
  const d = Math.floor(h / 24);
  const m = Math.floor((abs / 60_000) % 60);
  if (d >= 1) return `${overdue ? "-" : ""}${d}d ${h % 24}h`;
  return `${overdue ? "-" : ""}${h}h ${m}m`;
}
