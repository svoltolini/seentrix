/**
 * CRA readiness engine (Capstone). Aggregates the signals produced by Phases
 * 1–6 into a consolidated master checklist, grouped Pre-market / Ongoing /
 * Retention / Lifecycle, each item graded Complete / Partial / Missing /
 * Not-applicable from real product data, with a deep-link to the tab that fixes
 * it. Pure + unit-tested so the same result powers the per-product readiness
 * page, the org dashboard rollup, and the Copilot readiness tool.
 */

export const READINESS_GROUPS = [
  "pre_market",
  "ongoing",
  "retention",
  "lifecycle",
] as const;
export type ReadinessGroup = (typeof READINESS_GROUPS)[number];

export type ItemStatus = "complete" | "partial" | "missing" | "not_applicable";

export interface ReadinessItemDef {
  key: string;
  group: ReadinessGroup;
  /** Product sub-tab segment that fixes this item ("" = overview). */
  fixSegment: string;
}

export const READINESS_ITEMS: ReadinessItemDef[] = [
  { key: "annex_i", group: "pre_market", fixSegment: "/checklist" },
  { key: "sbom", group: "pre_market", fixSegment: "/sbom" },
  { key: "risk_assessment", group: "pre_market", fixSegment: "/risk-assessment" },
  { key: "diagrams", group: "pre_market", fixSegment: "/diagrams" },
  { key: "technical_file", group: "pre_market", fixSegment: "/technical-file" },
  { key: "declaration", group: "pre_market", fixSegment: "/documents" },
  { key: "ce_marking", group: "pre_market", fixSegment: "/identity" },
  { key: "product_identity", group: "pre_market", fixSegment: "/identity" },
  { key: "user_information", group: "pre_market", fixSegment: "/identity" },
  { key: "monitoring", group: "ongoing", fixSegment: "/lifecycle" },
  { key: "security_tests", group: "ongoing", fixSegment: "/lifecycle" },
  { key: "incident_readiness", group: "ongoing", fixSegment: "/incidents" },
  { key: "advisories", group: "ongoing", fixSegment: "/lifecycle" },
  { key: "technical_file_retention", group: "retention", fixSegment: "/technical-file" },
  { key: "supply_chain", group: "retention", fixSegment: "/lifecycle" },
  { key: "support_period", group: "lifecycle", fixSegment: "/releases" },
  { key: "end_of_support", group: "lifecycle", fixSegment: "/lifecycle" },
];

export interface ReadinessInput {
  annexIComplete: boolean;
  annexIStarted: boolean;
  hasActiveSbom: boolean;
  raReleased: boolean;
  raDraft: boolean;
  hasArchitectureDiagram: boolean;
  hasAnyDiagram: boolean;
  techFileReleased: boolean;
  techFileDraft: boolean;
  docFinal: boolean;
  docDraft: boolean;
  ceRecorded: boolean;
  identitySet: boolean;
  /** Annex II essentials: intended use + support end + security contact. */
  userInfoComplete: boolean;
  userInfoPartial: boolean;
  monitoringCount: number;
  securityTestCount: number;
  hasVdpPolicy: boolean;
  hasSecurityContact: boolean;
  advisoryCount: number;
  supplyChainCount: number;
  hasSupportStart: boolean;
  hasSupportEnd: boolean;
  hasEndOfSupportPlan: boolean; // eos notice OR corrective-action procedure
}

export interface ReadinessItem extends ReadinessItemDef {
  status: ItemStatus;
}

function band(complete: boolean, partial: boolean): ItemStatus {
  if (complete) return "complete";
  if (partial) return "partial";
  return "missing";
}

export function computeReadiness(i: ReadinessInput): ReadinessItem[] {
  const status: Record<string, ItemStatus> = {
    annex_i: band(i.annexIComplete, i.annexIStarted),
    sbom: band(i.hasActiveSbom, false),
    risk_assessment: band(i.raReleased, i.raDraft),
    diagrams: band(i.hasArchitectureDiagram, i.hasAnyDiagram),
    technical_file: band(i.techFileReleased, i.techFileDraft),
    declaration: band(i.docFinal, i.docDraft),
    ce_marking: band(i.ceRecorded, false),
    product_identity: band(i.identitySet, false),
    user_information: band(i.userInfoComplete, i.userInfoPartial),
    monitoring: band(i.monitoringCount > 0, false),
    security_tests: band(i.securityTestCount > 0, false),
    incident_readiness: band(
      i.hasVdpPolicy && i.hasSecurityContact,
      i.hasVdpPolicy || i.hasSecurityContact,
    ),
    advisories: band(i.advisoryCount > 0, false),
    technical_file_retention: band(i.techFileReleased, false),
    supply_chain: band(i.supplyChainCount > 0, false),
    support_period: band(i.hasSupportStart && i.hasSupportEnd, i.hasSupportStart || i.hasSupportEnd),
    end_of_support: band(i.hasEndOfSupportPlan, false),
  };
  return READINESS_ITEMS.map((d) => ({ ...d, status: status[d.key] }));
}

export function readinessScore(items: ReadinessItem[]): {
  complete: number;
  partial: number;
  missing: number;
  applicable: number;
  percent: number;
} {
  const applicable = items.filter((x) => x.status !== "not_applicable");
  const complete = applicable.filter((x) => x.status === "complete").length;
  const partial = applicable.filter((x) => x.status === "partial").length;
  const missing = applicable.filter((x) => x.status === "missing").length;
  const percent =
    applicable.length === 0
      ? 0
      : Math.round(((complete + partial * 0.5) / applicable.length) * 100);
  return { complete, partial, missing, applicable: applicable.length, percent };
}
