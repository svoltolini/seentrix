// Pure derivation of the "Declaration of Conformity ready" gate signals.
// Extracted from the conformity server action so the rules can be tested
// without a Supabase client. Behavior is unchanged.

export interface SbomGateRow {
  last_scanned_at: string | null;
}

/**
 * The checklist is "complete" only when there is at least one assessable
 * (non not_applicable) item AND every assessable item is completed. An empty
 * or all-not-applicable checklist is NOT complete — you cannot declare
 * conformity against nothing.
 */
export function isChecklistComplete(
  assessableCount: number | null,
  completedCount: number | null
): boolean {
  const assessable = assessableCount ?? 0;
  return assessable > 0 && assessable === (completedCount ?? 0);
}

/**
 * There is a usable SBOM only when at least one active SBOM has actually been
 * scanned (an uploaded-but-never-scanned SBOM does not satisfy the gate).
 */
export function hasScannedActiveSbom(sboms: SbomGateRow[] | null): boolean {
  return (sboms ?? []).some((s) => !!s.last_scanned_at);
}
