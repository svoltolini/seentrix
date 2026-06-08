/**
 * Annex VII technical-file model (CRA Phase 3).
 *
 * The technical file has 8 numbered points; point 2 has three sub-points
 * (a/b/c), giving nine sections in the assembled document. This module owns
 * the canonical ordering, the per-point "where do I fix it" deep-link, and the
 * pure coverage engine that grades each point Present / Partial / Missing from
 * the product's live data. The engine is pure + unit-tested so the same result
 * powers the on-screen coverage panel, the assembled PDF, and the Copilot
 * "what's missing from my technical file?" tool.
 */

export const ANNEX_VII_POINTS = [
  "general_description", // 1
  "design_architecture", // 2(a)
  "vuln_handling", // 2(b)
  "production_monitoring", // 2(c)
  "risk_assessment", // 3
  "support_period", // 4
  "standards", // 5
  "test_reports", // 6
  "declaration_of_conformity", // 7
] as const;

export type AnnexViiPoint = (typeof ANNEX_VII_POINTS)[number];

/** CRA Annex VII reference label per point (for UI + PDF headings). */
export const POINT_REF: Record<AnnexViiPoint, string> = {
  general_description: "1",
  design_architecture: "2(a)",
  vuln_handling: "2(b)",
  production_monitoring: "2(c)",
  risk_assessment: "3",
  support_period: "4",
  standards: "5",
  test_reports: "6",
  declaration_of_conformity: "7",
};

/** Product sub-tab segment to fix/complete each point ("" = product overview). */
export const POINT_FIX_SEGMENT: Record<AnnexViiPoint, string> = {
  general_description: "",
  design_architecture: "/diagrams",
  vuln_handling: "/sbom",
  production_monitoring: "/documents",
  risk_assessment: "/risk-assessment",
  support_period: "/releases",
  standards: "/documents",
  test_reports: "/diagrams",
  declaration_of_conformity: "/documents",
};

export type Coverage = "present" | "partial" | "missing";

/** Evidence categories that count as Annex VII point-6 "test reports". */
export const TEST_REPORT_CATEGORIES = [
  "test_report",
  "penetration_test",
  "code_analysis",
  "fuzzing",
  "third_party_test",
] as const;

/** Data gathered from the product's surfaces, fed to the pure engine. */
export interface ManifestInput {
  hasDescription: boolean;
  hasIntendedUse: boolean;
  releasesCount: number;
  isHardware: boolean;
  hasHardwarePhoto: boolean; // hardware_photo evidence or hardware_layout diagram
  hasArchitectureDiagram: boolean; // architecture OR data_flow
  hasAnyDiagram: boolean;
  hasActiveSbom: boolean;
  hasVdpPolicy: boolean; // vulnerability_disclosure_policy doc draft/final
  hasSecurityContact: boolean;
  hasUpdateMechanism: boolean; // tech-doc update_mechanism OR product update_channel
  hasProductionInfo: boolean; // tech-doc development_process/testing_results
  hasReleasedRiskAssessment: boolean;
  hasDraftRiskAssessment: boolean;
  hasSupportStart: boolean;
  hasSupportEnd: boolean;
  hasStandards: boolean; // DoC content.standards_applied non-empty
  hasTestReports: boolean;
  hasOtherEvidence: boolean; // due_diligence / other only
  docStatus: "final" | "draft" | "not_started"; // Declaration of Conformity
}

export interface ManifestEntry {
  point: AnnexViiPoint;
  ref: string;
  coverage: Coverage;
  fixSegment: string;
}

function band(present: boolean, partial: boolean): Coverage {
  if (present) return "present";
  if (partial) return "partial";
  return "missing";
}

export function computeManifest(i: ManifestInput): ManifestEntry[] {
  const coverageByPoint: Record<AnnexViiPoint, Coverage> = {
    // 1 — general description: description + intended use; sw versions and (for
    // hardware) photos strengthen it.
    general_description: band(
      i.hasDescription &&
        i.hasIntendedUse &&
        i.releasesCount > 0 &&
        (!i.isHardware || i.hasHardwarePhoto),
      i.hasDescription || i.hasIntendedUse,
    ),
    // 2(a) — design: architecture/data-flow drawing is the core; other
    // diagrams alone are partial.
    design_architecture: band(i.hasArchitectureDiagram, i.hasAnyDiagram),
    // 2(b) — vulnerability handling: SBOM + CVD policy + security contact.
    vuln_handling: band(
      i.hasActiveSbom && i.hasVdpPolicy && i.hasSecurityContact,
      i.hasActiveSbom || i.hasVdpPolicy || i.hasSecurityContact,
    ),
    // 2(c) — production & monitoring: secure-update mechanism + production info.
    production_monitoring: band(
      i.hasUpdateMechanism && i.hasProductionInfo,
      i.hasUpdateMechanism || i.hasProductionInfo,
    ),
    // 3 — risk assessment: a released assessment; a draft is partial.
    risk_assessment: band(
      i.hasReleasedRiskAssessment,
      i.hasDraftRiskAssessment,
    ),
    // 4 — support period: both ends set.
    support_period: band(
      i.hasSupportStart && i.hasSupportEnd,
      i.hasSupportStart || i.hasSupportEnd,
    ),
    // 5 — standards applied (from the DoC).
    standards: band(i.hasStandards, false),
    // 6 — test reports; other evidence alone is partial.
    test_reports: band(i.hasTestReports, i.hasOtherEvidence),
    // 7 — Declaration of Conformity: final is present, draft is partial.
    declaration_of_conformity: band(
      i.docStatus === "final",
      i.docStatus === "draft",
    ),
  };

  return ANNEX_VII_POINTS.map((point) => ({
    point,
    ref: POINT_REF[point],
    coverage: coverageByPoint[point],
    fixSegment: POINT_FIX_SEGMENT[point],
  }));
}

export function coverageScore(entries: ManifestEntry[]): {
  present: number;
  partial: number;
  missing: number;
  total: number;
  /** 0–100; partial counts as half. */
  percent: number;
} {
  const present = entries.filter((e) => e.coverage === "present").length;
  const partial = entries.filter((e) => e.coverage === "partial").length;
  const missing = entries.filter((e) => e.coverage === "missing").length;
  const total = entries.length;
  const percent =
    total === 0 ? 0 : Math.round(((present + partial * 0.5) / total) * 100);
  return { present, partial, missing, total, percent };
}

/**
 * Art 13(13) retention deadline: 10 years after release, or the support-period
 * end if that is later.
 */
export function retentionUntil(
  releasedAt: Date,
  supportPeriodEnd: Date | null,
): Date {
  const tenYears = new Date(releasedAt);
  tenYears.setFullYear(tenYears.getFullYear() + 10);
  if (supportPeriodEnd && supportPeriodEnd.getTime() > tenYears.getTime()) {
    return supportPeriodEnd;
  }
  return tenYears;
}
