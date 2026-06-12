/**
 * Qualitative 3×3 risk matrix for the CRA risk assessment (Phase 2).
 *
 * Each applicable Annex I requirement is scored on a Low/Medium/High
 * likelihood × Low/Medium/High impact scale. The inherent risk band is
 * derived from the pair via the standard heat-map below; the user then records
 * the residual risk (Low/Medium/High) that remains after the mitigating
 * controls described in `implementation`.
 *
 * Bands intentionally include `critical` only at High × High, matching the
 * colour vocabulary already used by the products list + PDF (low=success,
 * medium=warning, high/critical=destructive/accent).
 */

export const LIKELIHOOD_LEVELS = ["low", "medium", "high"] as const;
export const IMPACT_LEVELS = ["low", "medium", "high"] as const;
export const RESIDUAL_LEVELS = ["low", "medium", "high"] as const;

export type Likelihood = (typeof LIKELIHOOD_LEVELS)[number];
export type Impact = (typeof IMPACT_LEVELS)[number];
export type ResidualRisk = (typeof RESIDUAL_LEVELS)[number];

/** Derived inherent-risk bands. */
export type RiskBand = "low" | "medium" | "high" | "critical";

const SCORE: Record<Likelihood | Impact, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Standard 3×3 heat-map (likelihood × impact):
 *
 *            impact→   low      medium    high
 *   likelihood
 *     low              low      low       medium
 *     medium           low      medium    high
 *     high             medium   high      critical
 */
export function inherentRisk(
  likelihood: Likelihood,
  impact: Impact,
): RiskBand {
  const product = SCORE[likelihood] * SCORE[impact];
  if (product >= 9) return "critical"; // 3×3
  if (product >= 6) return "high"; // 2×3, 3×2
  if (product >= 3) return "medium"; // 3×1, 1×3, ~2×2(=4)
  return "low"; // 1×1, 1×2, 2×1
}

/** Tone token for a band/level — shared by the table badges + PDF colours. */
export const RISK_TONE: Record<RiskBand, "success" | "warning" | "destructive" | "accent"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
  critical: "accent",
};

/** Hex values for the PDF (no Tailwind tokens available in @react-pdf). */
export const RISK_HEX: Record<RiskBand, string> = {
  low: "#4CD964",
  medium: "#F59E0B",
  high: "#E60019",
  critical: "#FF6D00",
};

/**
 * STRIDE threat categories — OPTIONAL tags on risk-assessment items. The
 * CRA never mandates a methodology; these exist to make a threat analysis
 * defensible at audit, and releasing an assessment never requires them.
 */
export const STRIDE_CATEGORIES = [
  "spoofing",
  "tampering",
  "repudiation",
  "info_disclosure",
  "denial_of_service",
  "elevation_of_privilege",
] as const;
export type StrideCategory = (typeof STRIDE_CATEGORIES)[number];

export function isStrideCategory(v: unknown): v is StrideCategory {
  return (
    typeof v === "string" &&
    (STRIDE_CATEGORIES as readonly string[]).includes(v)
  );
}
