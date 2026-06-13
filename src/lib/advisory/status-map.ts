/**
 * The single source of truth for translating Seentrix's internal triage
 * state (status + resolution_type) into the controlled vocabularies of CSAF
 * and CycloneDX VEX. Kept pure + isolated so the mapping can be unit-tested
 * exhaustively — the legal weight of an advisory lives in these labels.
 *
 * Internal model (see vulnerabilities/actions.ts):
 *   status:          open | in_progress | resolved | accepted
 *   resolution_type: fix | mitigation | false_positive | wont_fix  (set when
 *                    a vuln is moved to resolved/accepted)
 */

import type { AdvisoryVulnerability } from "./types";

// CSAF 2.0 product_status keys we emit (Vulnerabilities → product_status).
export type CsafProductStatus =
  | "known_affected"
  | "known_not_affected"
  | "fixed"
  | "under_investigation";

// CycloneDX 1.6 vulnerability.analysis.state enum.
export type VexState =
  | "exploitable"
  | "in_triage"
  | "resolved"
  | "false_positive"
  | "not_affected";

type Triage = Pick<AdvisoryVulnerability, "status" | "resolutionType">;

/**
 * Map to a CSAF product_status. A freshly-detected, untriaged vuln is
 * `under_investigation`; a confirmed-but-unfixed one is `known_affected`;
 * an analyst false-positive is `known_not_affected`; a fixed one is `fixed`.
 * Mitigated / won't-fix remain `known_affected` (the code is still present)
 * and carry a remediation instead.
 */
export function toCsafProductStatus(v: Triage): CsafProductStatus {
  if (v.status === "open") return "under_investigation";
  if (v.status === "in_progress") return "known_affected";
  // resolved | accepted — key off how it was resolved.
  switch (v.resolutionType) {
    case "fix":
      return "fixed";
    case "false_positive":
      return "known_not_affected";
    case "mitigation":
    case "wont_fix":
      return "known_affected";
    default:
      // resolved with no recorded type → treat as fixed; accepted with no
      // type → an accepted (still-present) risk.
      return v.status === "resolved" ? "fixed" : "known_affected";
  }
}

/** Map to a CycloneDX VEX analysis.state. */
export function toVexState(v: Triage): VexState {
  if (v.status === "open") return "in_triage";
  if (v.status === "in_progress") return "exploitable";
  switch (v.resolutionType) {
    case "fix":
      return "resolved";
    case "false_positive":
      return "not_affected";
    case "mitigation":
    case "wont_fix":
      return "exploitable";
    default:
      return v.status === "resolved" ? "resolved" : "exploitable";
  }
}

/**
 * CSAF flag label for a `known_not_affected` product. We do not capture the
 * precise engineering reason, so the conservative, honest default for an
 * analyst-marked false positive is that the vulnerable code is not present
 * in the shipped product. The free-text impact statement (resolution notes)
 * carries any nuance.
 */
export function csafJustificationLabel(_v: Triage): string {
  return "vulnerable_code_not_present";
}

/** CycloneDX VEX justification — only meaningful for `not_affected`. */
export function vexJustification(_v: Triage): string {
  return "code_not_present";
}

/**
 * CycloneDX VEX responses (analysis.response). Communicates what the vendor
 * did/will do. Empty for untriaged / under-investigation items.
 */
export function vexResponses(v: Triage): string[] {
  switch (v.resolutionType) {
    case "fix":
      return ["update"];
    case "mitigation":
      return ["workaround_available"];
    case "wont_fix":
      return ["will_not_fix"];
    default:
      return [];
  }
}

/**
 * CSAF remediation category for a vulnerability, or null when none applies
 * (e.g. still under investigation). `none_available` is used for won't-fix.
 */
export function csafRemediationCategory(
  v: Triage,
): "vendor_fix" | "mitigation" | "none_available" | null {
  const csaf = toCsafProductStatus(v);
  if (csaf === "fixed") return "vendor_fix";
  if (v.resolutionType === "mitigation") return "mitigation";
  if (v.resolutionType === "wont_fix") return "none_available";
  return null;
}
