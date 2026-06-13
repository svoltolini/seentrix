// CRA harmonised standards & presumption of conformity (Article 27).
//
// A product conforming to a harmonised standard whose reference is published
// in the Official Journal is *presumed* to conform to the Annex I essential
// requirements the standard covers (Art 27(1)). Common specifications
// (Art 27(5)) and European cybersecurity certification schemes (Art 27(8)–(9))
// can confer the same presumption.
//
// As of early 2026 the dedicated CRA standards are still being developed:
// standardisation request M/606 was accepted by CEN, CENELEC and ETSI on
// 3 April 2025 (41 deliverables), with the horizontal cornerstone standards
// not yet cited in the OJ. This catalogue surfaces that landscape — what each
// standard is expected to cover, and its current status — so a manufacturer
// can plan which standard will give presumption of conformity for which
// requirements. Statuses are kept honest: nothing is yet a *CRA* harmonised
// standard. Titles/notes are translated (by `id`); refs/articles are
// technical tokens shown as-is.

import { CRA_REQUIREMENTS } from "./cra-requirements";

export type StandardStatus = "published" | "in_development" | "potential";
export type StandardKind =
  | "harmonised_standard"
  | "common_specification"
  | "certification_scheme";
export type StandardScope = "horizontal" | "vertical" | "scheme";

export interface CraStandard {
  /** Stable key for i18n + mapping. */
  id: string;
  /** Citation reference, shown verbatim (technical token). */
  ref: string;
  kind: StandardKind;
  scope: StandardScope;
  status: StandardStatus;
  /** Annex I parts the standard is expected to cover. */
  coversParts: ("part_i" | "part_ii")[];
  /**
   * Specific Annex I requirement ids covered. An empty array means "all
   * requirements in coversParts" (used for the broad horizontal standards).
   */
  coversRequirementIds: string[];
  /** The Article 27 basis for the presumption / the standardisation source. */
  craArticle: string;
}

export const CRA_STANDARDS: CraStandard[] = [
  // ── Existing radio-equipment standards (harmonised under the RED), widely
  //    treated as the closest baseline for Annex I Part I until the dedicated
  //    CRA horizontal standards land. ──
  {
    id: "en_18031_1",
    ref: "EN 18031-1:2024",
    kind: "harmonised_standard",
    scope: "horizontal",
    status: "published",
    coversParts: ["part_i"],
    coversRequirementIds: [
      "unauthorized_access_protection",
      "secure_default_config",
      "attack_surface_minimization",
      "security_updates",
      "availability_resilience",
    ],
    craArticle: "RED 2022/30 (candidate CRA baseline)",
  },
  {
    id: "en_18031_2",
    ref: "EN 18031-2:2024",
    kind: "harmonised_standard",
    scope: "horizontal",
    status: "published",
    coversParts: ["part_i"],
    coversRequirementIds: ["data_confidentiality", "data_minimization"],
    craArticle: "RED 2022/30 (candidate CRA baseline)",
  },
  {
    id: "en_18031_3",
    ref: "EN 18031-3:2024",
    kind: "harmonised_standard",
    scope: "horizontal",
    status: "published",
    coversParts: ["part_i"],
    coversRequirementIds: ["data_integrity"],
    craArticle: "RED 2022/30 (candidate CRA baseline)",
  },
  // ── The dedicated CRA horizontal cornerstone standards under M/606. ──
  {
    id: "cra_horizontal_product",
    ref: "EN 40000-series (horizontal, product requirements)",
    kind: "harmonised_standard",
    scope: "horizontal",
    status: "in_development",
    coversParts: ["part_i"],
    coversRequirementIds: [], // all of Part I
    craArticle: "Art 27(1) — standardisation request M/606",
  },
  {
    id: "cra_horizontal_vuln_handling",
    ref: "EN 40000-series (horizontal, vulnerability handling)",
    kind: "harmonised_standard",
    scope: "horizontal",
    status: "in_development",
    coversParts: ["part_ii"],
    coversRequirementIds: [], // all of Part II
    craArticle: "Art 27(1) — standardisation request M/606",
  },
  // ── Fallback instruments. ──
  {
    id: "common_specifications",
    ref: "Commission common specifications",
    kind: "common_specification",
    scope: "horizontal",
    status: "potential",
    coversParts: ["part_i", "part_ii"],
    coversRequirementIds: [],
    craArticle: "Art 27(5) — implementing act",
  },
  {
    id: "eucc_scheme",
    ref: "EUCC (Common Criteria certification scheme)",
    kind: "certification_scheme",
    scope: "scheme",
    status: "published",
    coversParts: ["part_i", "part_ii"],
    coversRequirementIds: [],
    craArticle: "Art 27(8)–(9) — Reg (EU) 2019/881",
  },
];

const ALL_PART_I = CRA_REQUIREMENTS.filter((r) => r.part === "part_i").map(
  (r) => r.id,
);
const ALL_PART_II = CRA_REQUIREMENTS.filter((r) => r.part === "part_ii").map(
  (r) => r.id,
);

/** The concrete requirement ids a standard covers (expanding "all in part"). */
export function requirementsCoveredBy(standard: CraStandard): string[] {
  if (standard.coversRequirementIds.length > 0) {
    return [...standard.coversRequirementIds];
  }
  const ids: string[] = [];
  if (standard.coversParts.includes("part_i")) ids.push(...ALL_PART_I);
  if (standard.coversParts.includes("part_ii")) ids.push(...ALL_PART_II);
  return ids;
}

/**
 * Given a set of applied standard ids, the set of Annex I requirement ids
 * that would benefit from a presumption of conformity. Standards that are not
 * yet `published` are excluded by default — an in-development standard
 * confers no presumption until its reference is cited in the OJ.
 */
export function presumptionCoverage(
  appliedStandardIds: string[],
  opts: { includeUnpublished?: boolean } = {},
): Set<string> {
  const applied = new Set(appliedStandardIds);
  const covered = new Set<string>();
  for (const s of CRA_STANDARDS) {
    if (!applied.has(s.id)) continue;
    if (!opts.includeUnpublished && s.status !== "published") continue;
    for (const id of requirementsCoveredBy(s)) covered.add(id);
  }
  return covered;
}

/** Standards that cover a given requirement id. */
export function standardsForRequirement(requirementId: string): CraStandard[] {
  return CRA_STANDARDS.filter((s) =>
    requirementsCoveredBy(s).includes(requirementId),
  );
}
