"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import {
  DELETION_GRACE_DAYS,
  type DeletionStatus,
  type OrgExport,
} from "./gdpr-types";

type ActionResult = { error?: string } | undefined;

async function getAuthContext() {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { supabase, user: null, orgId: null };

  const orgId = user.app_metadata?.org_id as string | undefined;
  return { supabase, user, orgId: orgId ?? null };
}

async function getCallerRole(userId: string, orgId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .eq("org_id", orgId)
    .single();
  return (data as { role: string } | null)?.role ?? null;
}

// ---------------------------------------------------------------------------
// GDPR Art. 20 — data portability. Returns every row scoped to the caller's
// org, serialised as JSON so the customer can move to another provider. We
// deliberately omit raw binary files (SBOM attachments, avatars) — those
// remain accessible via the existing signed-URL flows and would bloat the
// payload enormously.
// ---------------------------------------------------------------------------

export async function exportOrgData(): Promise<{ json?: string; error?: string }> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  const callerRole = await getCallerRole(user.id, orgId);
  if (callerRole !== "admin") return { error: "notAdmin" };

  // First fetch org + direct org-scoped tables.
  const [
    orgRes,
    usersRes,
    productsRes,
    documentsRes,
    invitesRes,
    activitiesRes,
    snapshotsRes,
    incidentsRes,
    reportsRes,
    obligationsRes,
    academyCompletionsRes,
    academyAttemptsRes,
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    supabase.from("users").select("*").eq("org_id", orgId),
    supabase.from("products").select("*").eq("org_id", orgId),
    supabase.from("documents").select("*"),
    supabase.from("invites").select("*").eq("org_id", orgId),
    supabase.from("activities").select("*").eq("org_id", orgId),
    supabase.from("compliance_snapshots").select("*").eq("org_id", orgId),
    supabase.from("incidents").select("*").eq("org_id", orgId),
    supabase.from("vulnerability_reports").select("*").eq("org_id", orgId),
    supabase.from("entity_obligations").select("*").eq("org_id", orgId),
    supabase.from("academy_completions").select("*").eq("org_id", orgId),
    supabase.from("academy_quiz_attempts").select("*").eq("org_id", orgId),
  ]);

  const products = (productsRes.data as Record<string, unknown>[]) ?? [];
  const productIds = products.map((p) => p.id as string);

  // Product-scoped tables — fetched only after we know the product ids so
  // we don't leak other orgs' data through stale RLS assumptions.
  const [
    answersRes,
    checklistRes,
    sbomsRes,
    conformityRes,
    releasesRes,
  ] = productIds.length > 0
    ? await Promise.all([
        supabase.from("assessment_answers").select("*").in("product_id", productIds),
        supabase.from("checklist_items").select("*").in("product_id", productIds),
        supabase.from("sboms").select("*").in("product_id", productIds),
        supabase.from("product_conformity_steps").select("*").in("product_id", productIds),
        supabase.from("product_releases").select("*").in("product_id", productIds),
      ])
    : [
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] },
      ];

  const sboms = (sbomsRes.data as Record<string, unknown>[]) ?? [];
  const sbomIds = sboms.map((s) => s.id as string);

  const [componentsRes] = sbomIds.length > 0
    ? await Promise.all([
        supabase.from("sbom_components").select("*").in("sbom_id", sbomIds),
      ])
    : [{ data: [] }];

  const components = (componentsRes.data as Record<string, unknown>[]) ?? [];
  const componentIds = components.map((c) => c.id as string);

  // Chunk the id list so a large SBOM doesn't blow past the request URL
  // length limit (which would silently drop vulns from the export).
  const vulnRows: Record<string, unknown>[] = [];
  const GDPR_ID_CHUNK = 200;
  for (let k = 0; k < componentIds.length; k += GDPR_ID_CHUNK) {
    const { data } = await supabase
      .from("vulnerabilities")
      .select("*")
      .in("sbom_component_id", componentIds.slice(k, k + GDPR_ID_CHUNK));
    if (data) vulnRows.push(...(data as Record<string, unknown>[]));
  }
  const vulnsRes = { data: vulnRows };

  // documents are scoped by product_id; filter client-side since the RLS
  // policy should already restrict, but we double-check for defence in depth.
  const allDocuments = (documentsRes.data as Record<string, unknown>[]) ?? [];
  const documents = allDocuments.filter((d) =>
    productIds.includes(d.product_id as string),
  );

  const payload: OrgExport = {
    meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: { id: user.id, email: user.email ?? null },
      schemaVersion: 1,
      orgId,
    },
    organization: (orgRes.data as Record<string, unknown>) ?? null,
    users: (usersRes.data as Record<string, unknown>[]) ?? [],
    products,
    assessment_answers: (answersRes.data as Record<string, unknown>[]) ?? [],
    checklist_items: (checklistRes.data as Record<string, unknown>[]) ?? [],
    sboms,
    sbom_components: components,
    vulnerabilities: (vulnsRes.data as Record<string, unknown>[]) ?? [],
    documents,
    invites: (invitesRes.data as Record<string, unknown>[]) ?? [],
    activities: (activitiesRes.data as Record<string, unknown>[]) ?? [],
    compliance_snapshots: (snapshotsRes.data as Record<string, unknown>[]) ?? [],
    incidents: (incidentsRes.data as Record<string, unknown>[]) ?? [],
    product_releases: (releasesRes.data as Record<string, unknown>[]) ?? [],
    product_conformity_steps:
      (conformityRes.data as Record<string, unknown>[]) ?? [],
    vulnerability_reports: (reportsRes.data as Record<string, unknown>[]) ?? [],
    entity_obligations: (obligationsRes.data as Record<string, unknown>[]) ?? [],
    academy_completions:
      (academyCompletionsRes.data as Record<string, unknown>[]) ?? [],
    academy_quiz_attempts:
      (academyAttemptsRes.data as Record<string, unknown>[]) ?? [],
  };

  await logActivity({
    action: "gdpr.export_generated",
    targetType: "organization",
    targetId: orgId,
  });

  return { json: JSON.stringify(payload, null, 2) };
}

// ---------------------------------------------------------------------------
// GDPR Art. 17 — right to erasure. Marks the org for deletion; the actual
// hard purge runs 30 days later through a separate scheduled job (to be
// wired post-launch). Admins can cancel any time during the grace window.
// ---------------------------------------------------------------------------

export async function getDeletionStatus(): Promise<DeletionStatus | null> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return null;

  const { data } = await supabase
    .from("organizations")
    .select("deletion_requested_at, deletion_requested_by")
    .eq("id", orgId)
    .maybeSingle();

  const record = data as
    | { deletion_requested_at: string | null; deletion_requested_by: string | null }
    | null;

  if (!record?.deletion_requested_at) {
    return {
      requestedAt: null,
      requestedBy: null,
      purgeAt: null,
      daysRemaining: null,
    };
  }

  const purgeAt = new Date(record.deletion_requested_at);
  purgeAt.setDate(purgeAt.getDate() + DELETION_GRACE_DAYS);
  const daysRemaining = Math.max(
    0,
    Math.ceil((purgeAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return {
    requestedAt: record.deletion_requested_at,
    requestedBy: record.deletion_requested_by,
    purgeAt: purgeAt.toISOString(),
    daysRemaining,
  };
}

export async function requestOrgDeletion(
  confirmName: string,
): Promise<ActionResult> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  const callerRole = await getCallerRole(user.id, orgId);
  if (callerRole !== "admin") return { error: "notAdmin" };

  // Fetch org name so we can enforce the typed-confirmation check. This is
  // the same "type DELETE to confirm"-style guardrail GitHub / Linear use;
  // it turns an accidental misclick into a no-op.
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = (org as { name: string } | null)?.name ?? "";
  if (!orgName || confirmName.trim() !== orgName) {
    return { error: "confirmationMismatch" };
  }

  // Use admin client so this works even if RLS is tightened later. Only
  // admins reach this branch anyway — the role check above gates it.
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("organizations")
    .update({
      deletion_requested_at: new Date().toISOString(),
      deletion_requested_by: user.id,
    })
    .eq("id", orgId);

  if (error) return { error: "generic" };

  await logActivity({
    action: "gdpr.deletion_requested",
    targetType: "organization",
    targetId: orgId,
    targetName: orgName,
    metadata: { graceDays: DELETION_GRACE_DAYS },
  });

  return {};
}

export async function cancelOrgDeletion(): Promise<ActionResult> {
  const { supabase, user, orgId } = await getAuthContext();
  if (!user || !orgId) return { error: "notAuthenticated" };

  const callerRole = await getCallerRole(user.id, orgId);
  if (callerRole !== "admin") return { error: "notAdmin" };

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("organizations")
    .update({
      deletion_requested_at: null,
      deletion_requested_by: null,
    })
    .eq("id", orgId);

  if (error) return { error: "generic" };

  // Re-fetch the name for the activity log.
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  await logActivity({
    action: "gdpr.deletion_cancelled",
    targetType: "organization",
    targetId: orgId,
    targetName: (org as { name: string } | null)?.name ?? undefined,
  });

  return {};
}
