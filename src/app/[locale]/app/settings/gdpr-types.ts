// Shared types + constants for the GDPR flow.
//
// Kept in a separate module because Next.js 16 strips every non-async
// export from `"use server"` files at build time — which would erase these
// if they lived alongside the actions.

export const DELETION_GRACE_DAYS = 30;

export interface DeletionStatus {
  requestedAt: string | null;
  requestedBy: string | null;
  purgeAt: string | null;
  daysRemaining: number | null;
}

export interface OrgExport {
  meta: {
    exportedAt: string;
    exportedBy: { id: string; email: string | null };
    schemaVersion: 1;
    orgId: string;
  };
  organization: Record<string, unknown> | null;
  users: Record<string, unknown>[];
  products: Record<string, unknown>[];
  assessment_answers: Record<string, unknown>[];
  checklist_items: Record<string, unknown>[];
  sboms: Record<string, unknown>[];
  sbom_components: Record<string, unknown>[];
  vulnerabilities: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  invites: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  compliance_snapshots: Record<string, unknown>[];
  incidents: Record<string, unknown>[];
  product_releases: Record<string, unknown>[];
  product_conformity_steps: Record<string, unknown>[];
  vulnerability_reports: Record<string, unknown>[];
  entity_obligations: Record<string, unknown>[];
  academy_completions: Record<string, unknown>[];
  academy_quiz_attempts: Record<string, unknown>[];
}
