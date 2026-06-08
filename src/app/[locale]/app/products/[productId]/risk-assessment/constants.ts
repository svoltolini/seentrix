/**
 * Risk-assessment feature constants — kept in lockstep with migration
 * 00043 (the SQL CHECK constraints) and src/lib/constants/cra-requirements.ts
 * (the canonical Annex I requirement list). The companion test asserts the
 * migration text contains every enum value below.
 */

import {
  CRA_REQUIREMENTS,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  type CraRequirement,
} from "@/lib/constants/cra-requirements";
import {
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RESIDUAL_LEVELS,
  type Likelihood,
  type Impact,
  type ResidualRisk,
} from "@/lib/constants/risk-matrix";

export const APPLICABILITY = ["applies", "not_applicable"] as const;
export type Applicability = (typeof APPLICABILITY)[number];

export const STATUSES = ["draft", "released"] as const;
export type RaStatus = (typeof STATUSES)[number];

/** All Annex I requirement ids in display order (Part I then Part II). */
export const REQUIREMENT_IDS: string[] = CRA_REQUIREMENTS.map((r) => r.id);

export {
  CRA_REQUIREMENTS,
  PART_I_REQUIREMENTS,
  PART_II_REQUIREMENTS,
  LIKELIHOOD_LEVELS,
  IMPACT_LEVELS,
  RESIDUAL_LEVELS,
};
export type { CraRequirement, Likelihood, Impact, ResidualRisk };

export function isApplicability(v: unknown): v is Applicability {
  return typeof v === "string" && (APPLICABILITY as readonly string[]).includes(v);
}
export function isLikelihood(v: unknown): v is Likelihood {
  return typeof v === "string" && (LIKELIHOOD_LEVELS as readonly string[]).includes(v);
}
export function isImpact(v: unknown): v is Impact {
  return typeof v === "string" && (IMPACT_LEVELS as readonly string[]).includes(v);
}
export function isResidual(v: unknown): v is ResidualRisk {
  return typeof v === "string" && (RESIDUAL_LEVELS as readonly string[]).includes(v);
}
