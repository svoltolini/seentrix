/**
 * Lifecycle & supply-chain enums (CRA Phase 6), kept in lockstep with the SQL
 * CHECK constraints in migration 00047 (asserted by the companion test).
 */

export const SUPPLY_RELATIONS = [
  "upstream_supplier",
  "downstream_operator",
] as const;
export type SupplyRelation = (typeof SUPPLY_RELATIONS)[number];

export const MONITORING_SOURCES = [
  "internal_review",
  "advisory",
  "incident",
  "security_test",
  "external_report",
  "other",
] as const;
export type MonitoringSource = (typeof MONITORING_SOURCES)[number];

export const MONITORING_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
export type MonitoringSeverity = (typeof MONITORING_SEVERITIES)[number];

export const ADVISORY_SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type AdvisorySeverity = (typeof ADVISORY_SEVERITIES)[number];

export const TEST_TYPES = [
  "penetration_test",
  "code_analysis",
  "fuzzing",
  "sast",
  "dast",
  "third_party_audit",
  "other",
] as const;
export type TestType = (typeof TEST_TYPES)[number];

const inSet = (arr: readonly string[]) => (v: unknown): boolean =>
  typeof v === "string" && arr.includes(v);

export const isSupplyRelation = inSet(SUPPLY_RELATIONS);
export const isMonitoringSource = inSet(MONITORING_SOURCES);
export const isMonitoringSeverity = inSet(MONITORING_SEVERITIES);
export const isAdvisorySeverity = inSet(ADVISORY_SEVERITIES);
export const isTestType = inSet(TEST_TYPES);

/** Add `frequency_days` to a base date to compute the next-due date. */
export function nextDue(lastPerformed: Date, frequencyDays: number): Date {
  return new Date(lastPerformed.getTime() + frequencyDays * 86_400_000);
}
