// CRA Annex I — Essential Cybersecurity Requirements
// Part I: Security Requirements (13 items)
// Part II: Vulnerability Handling Requirements (8 items)

export interface CraRequirement {
  id: string;
  part: "part_i" | "part_ii";
  article: string;
  order: number;
}

// ---------------------------------------------------------------------------
// Part I — Security Requirements (13)
// ---------------------------------------------------------------------------

const PART_I: CraRequirement[] = [
  {
    id: "secure_by_design",
    part: "part_i",
    article: "Annex I, Part I, (1)",
    order: 1,
  },
  {
    id: "no_known_vulnerabilities",
    part: "part_i",
    article: "Annex I, Part I, (2)",
    order: 2,
  },
  {
    id: "risk_based_assessment",
    part: "part_i",
    article: "Annex I, Part I, (3)",
    order: 3,
  },
  {
    id: "secure_default_config",
    part: "part_i",
    article: "Annex I, Part I, (3)(a)",
    order: 4,
  },
  {
    id: "unauthorized_access_protection",
    part: "part_i",
    article: "Annex I, Part I, (3)(b)",
    order: 5,
  },
  {
    id: "data_confidentiality",
    part: "part_i",
    article: "Annex I, Part I, (3)(c)",
    order: 6,
  },
  {
    id: "data_integrity",
    part: "part_i",
    article: "Annex I, Part I, (3)(d)",
    order: 7,
  },
  {
    id: "data_minimization",
    part: "part_i",
    article: "Annex I, Part I, (3)(e)",
    order: 8,
  },
  {
    id: "availability_resilience",
    part: "part_i",
    article: "Annex I, Part I, (3)(f)",
    order: 9,
  },
  {
    id: "attack_surface_minimization",
    part: "part_i",
    article: "Annex I, Part I, (3)(g)",
    order: 10,
  },
  {
    id: "incident_impact_reduction",
    part: "part_i",
    article: "Annex I, Part I, (3)(h)",
    order: 11,
  },
  {
    id: "security_logging",
    part: "part_i",
    article: "Annex I, Part I, (3)(i)",
    order: 12,
  },
  {
    id: "security_updates",
    part: "part_i",
    article: "Annex I, Part I, (3)(j)",
    order: 13,
  },
];

// ---------------------------------------------------------------------------
// Part II — Vulnerability Handling Requirements (8)
// ---------------------------------------------------------------------------

const PART_II: CraRequirement[] = [
  {
    id: "vulnerability_identification",
    part: "part_ii",
    article: "Annex I, Part II, (1)",
    order: 14,
  },
  {
    id: "vulnerability_remediation",
    part: "part_ii",
    article: "Annex I, Part II, (2)",
    order: 15,
  },
  {
    id: "security_testing",
    part: "part_ii",
    article: "Annex I, Part II, (3)",
    order: 16,
  },
  {
    id: "vulnerability_disclosure",
    part: "part_ii",
    article: "Annex I, Part II, (4)",
    order: 17,
  },
  {
    id: "coordinated_disclosure_policy",
    part: "part_ii",
    article: "Annex I, Part II, (5)",
    order: 18,
  },
  {
    id: "vulnerability_info_sharing",
    part: "part_ii",
    article: "Annex I, Part II, (6)",
    order: 19,
  },
  {
    id: "sbom_maintenance",
    part: "part_ii",
    article: "Annex I, Part II, (7)",
    order: 20,
  },
  {
    id: "security_advisories",
    part: "part_ii",
    article: "Annex I, Part II, (8)",
    order: 21,
  },
];

// ---------------------------------------------------------------------------
// Combined & exports
// ---------------------------------------------------------------------------

export const CRA_REQUIREMENTS: CraRequirement[] = [...PART_I, ...PART_II];

export const PART_I_REQUIREMENTS = PART_I;
export const PART_II_REQUIREMENTS = PART_II;

// Status values matching the DB constraint
export const CHECKLIST_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "not_applicable",
] as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

// ---------------------------------------------------------------------------
// Compliance score calculation
// ---------------------------------------------------------------------------

export function calculateComplianceScore(
  items: { status: string }[]
): number {
  const applicable = items.filter((i) => i.status !== "not_applicable");
  if (applicable.length === 0) return 100;
  const completed = applicable.filter((i) => i.status === "completed").length;
  return Math.round((completed / applicable.length) * 100);
}

// ---------------------------------------------------------------------------
// Description field helpers (stores notes + evidence paths as JSON)
// ---------------------------------------------------------------------------

export interface ItemDescription {
  notes: string;
  evidence: string[];
}

export function parseItemDescription(raw: string | null): ItemDescription {
  if (!raw) return { notes: "", evidence: [] };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "notes" in parsed) {
      return {
        notes: (parsed.notes as string) ?? "",
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      };
    }
    return { notes: raw, evidence: [] };
  } catch {
    return { notes: raw, evidence: [] };
  }
}

export function serializeItemDescription(data: ItemDescription): string {
  if (data.evidence.length === 0) return data.notes;
  return JSON.stringify(data);
}
