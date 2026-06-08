// Plain constants for the Diagrams & Evidence surface — kept out of
// `actions.ts` because Next.js "use server" files can only export async
// functions (a primitive/array export trips a build-time error). Both the
// client component and the server actions import from here.

/** Diagram types — mirrors the CHECK constraint in
 *  `supabase/migrations/00041_product_diagrams_evidence.sql`. */
export const DIAGRAM_TYPES = [
  "architecture",
  "data_flow",
  "environment",
  "threat_model",
  "hardware_layout",
] as const;

export type DiagramType = (typeof DIAGRAM_TYPES)[number];

/** Evidence categories — mirrors the CHECK constraint in migration 00041. */
export const EVIDENCE_CATEGORIES = [
  "test_report",
  "penetration_test",
  "code_analysis",
  "fuzzing",
  "third_party_test",
  "due_diligence",
  "hardware_photo",
  "other",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

/** Suggested Annex VII points for the evidence tagger. Free-text is also
 *  allowed, but these cover the common test-report / diagram mappings so the
 *  Phase-3 technical-file assembler can slot evidence into the right slot. */
export const ANNEX_VII_POINTS = [
  "1.3", // hardware photos / illustrations
  "2.a", // architecture + data-flow diagrams
  "2.b", // SBOM / CVD / secure update
  "2.c", // production + monitoring
  "3", // risk assessment
  "5", // standards applied
  "6", // test reports
] as const;

/** Max evidence upload size — mirrors the `product-evidence` bucket cap. */
export const EVIDENCE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/** Accepted evidence MIME types — mirrored from the storage bucket allowlist
 *  (`supabase/migrations/00041_product_diagrams_evidence.sql`). */
export const EVIDENCE_ALLOWED_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

/** Max exported-PNG / scene-JSON size for a diagram — mirrors the
 *  `product-diagrams` bucket cap (10 MB). */
export const DIAGRAM_ASSET_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
