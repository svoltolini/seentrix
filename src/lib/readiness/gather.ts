import type { createClient } from "@/lib/supabase/server";
import type { ReadinessInput } from "@/lib/constants/cra-readiness";

type SB = Awaited<ReturnType<typeof createClient>>;

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * Gather the readiness signals for a set of products in one batch of org-wide
 * queries (so the dashboard rollup doesn't fan out per product). Returns a map
 * product_id → ReadinessInput.
 *
 * Lives in a plain module (not a "use server" file) so both the readiness
 * server actions and the Copilot `getReadiness` tool can share it.
 */
export async function gatherReadinessInputs(
  supabase: SB,
  orgId: string,
  productIds: string[],
): Promise<Map<string, ReadinessInput>> {
  const map = new Map<string, ReadinessInput>();
  if (productIds.length === 0) return map;

  const [
    { data: products },
    { data: org },
    { data: snapshots },
    { data: sboms },
    { data: ras },
    { data: diagrams },
    { data: techFiles },
    { data: docs },
    { data: monitoring },
    { data: tests },
    { data: advisories },
    { data: suppliers },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, intended_use, model_number, batch_number, serial_number, ce_locations, ce_affixed_at, eos_notice, corrective_action_procedure, support_period_start, support_period_end",
      )
      .in("id", productIds),
    supabase
      .from("organizations")
      .select("security_contact_email")
      .eq("id", orgId)
      .maybeSingle(),
    supabase
      .from("compliance_snapshots")
      .select("product_id, completed_items, applicable_items, snapshot_date")
      .in("product_id", productIds)
      .order("snapshot_date", { ascending: false }),
    supabase.from("sboms").select("product_id").eq("is_active", true).in("product_id", productIds),
    supabase.from("risk_assessments").select("product_id, status").in("product_id", productIds),
    supabase.from("product_diagrams").select("product_id, type").in("product_id", productIds),
    supabase.from("technical_files").select("product_id, status").in("product_id", productIds),
    supabase.from("documents").select("product_id, document_type, status").in("product_id", productIds),
    supabase.from("monitoring_entries").select("product_id").in("product_id", productIds),
    supabase.from("security_tests").select("product_id").in("product_id", productIds),
    supabase.from("vulnerability_advisories").select("product_id").in("product_id", productIds),
    supabase.from("supply_chain_entries").select("product_id").in("product_id", productIds),
  ]);

  const hasSecurityContact = filled(
    (org as { security_contact_email: string | null } | null)?.security_contact_email,
  );

  // Latest snapshot per product.
  const latestSnapshot = new Map<string, { completed_items: number; applicable_items: number }>();
  for (const s of (snapshots as { product_id: string; completed_items: number; applicable_items: number }[] | null) ?? []) {
    if (!latestSnapshot.has(s.product_id)) latestSnapshot.set(s.product_id, s);
  }

  const countBy = (rows: { product_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.product_id, (m.get(r.product_id) ?? 0) + 1);
    return m;
  };
  const monitoringCount = countBy(monitoring as { product_id: string }[] | null);
  const testCount = countBy(tests as { product_id: string }[] | null);
  const advisoryCount = countBy(advisories as { product_id: string }[] | null);
  const supplyCount = countBy(suppliers as { product_id: string }[] | null);

  const activeSbom = new Set(((sboms as { product_id: string }[] | null) ?? []).map((r) => r.product_id));

  const raByProduct = new Map<string, Set<string>>();
  for (const r of (ras as { product_id: string; status: string }[] | null) ?? []) {
    if (!raByProduct.has(r.product_id)) raByProduct.set(r.product_id, new Set());
    raByProduct.get(r.product_id)!.add(r.status);
  }
  const diagramsByProduct = new Map<string, Set<string>>();
  for (const r of (diagrams as { product_id: string; type: string }[] | null) ?? []) {
    if (!diagramsByProduct.has(r.product_id)) diagramsByProduct.set(r.product_id, new Set());
    diagramsByProduct.get(r.product_id)!.add(r.type);
  }
  const tfByProduct = new Map<string, Set<string>>();
  for (const r of (techFiles as { product_id: string; status: string }[] | null) ?? []) {
    if (!tfByProduct.has(r.product_id)) tfByProduct.set(r.product_id, new Set());
    tfByProduct.get(r.product_id)!.add(r.status);
  }
  const docsByProduct = new Map<string, Record<string, string>>();
  for (const r of (docs as { product_id: string; document_type: string; status: string }[] | null) ?? []) {
    if (!docsByProduct.has(r.product_id)) docsByProduct.set(r.product_id, {});
    docsByProduct.get(r.product_id)![r.document_type] = r.status;
  }

  for (const p of (products as Record<string, unknown>[] | null) ?? []) {
    const id = p.id as string;
    const snap = latestSnapshot.get(id);
    const ra = raByProduct.get(id) ?? new Set();
    const dg = diagramsByProduct.get(id) ?? new Set();
    const tf = tfByProduct.get(id) ?? new Set();
    const docMap = docsByProduct.get(id) ?? {};
    const ceLocations = (p.ce_locations as string[] | null) ?? [];
    const intendedUse = filled(p.intended_use);
    const supportEnd = filled(p.support_period_end);

    map.set(id, {
      annexIComplete: !!snap && snap.applicable_items > 0 && snap.completed_items >= snap.applicable_items,
      annexIStarted: !!snap && snap.completed_items > 0,
      hasActiveSbom: activeSbom.has(id),
      raReleased: ra.has("released"),
      raDraft: ra.has("draft"),
      hasArchitectureDiagram: dg.has("architecture") || dg.has("data_flow"),
      hasAnyDiagram: dg.size > 0,
      techFileReleased: tf.has("released"),
      techFileDraft: tf.has("draft"),
      docFinal: docMap["declaration_of_conformity"] === "final",
      docDraft: docMap["declaration_of_conformity"] === "draft",
      ceRecorded: ceLocations.length > 0 || !!p.ce_affixed_at,
      identitySet: filled(p.model_number) || filled(p.batch_number) || filled(p.serial_number),
      userInfoComplete: intendedUse && supportEnd && hasSecurityContact,
      userInfoPartial: intendedUse || supportEnd,
      monitoringCount: monitoringCount.get(id) ?? 0,
      securityTestCount: testCount.get(id) ?? 0,
      hasVdpPolicy:
        !!docMap["vulnerability_disclosure_policy"] &&
        docMap["vulnerability_disclosure_policy"] !== "not_started",
      hasSecurityContact,
      advisoryCount: advisoryCount.get(id) ?? 0,
      supplyChainCount: supplyCount.get(id) ?? 0,
      hasSupportStart: filled(p.support_period_start),
      hasSupportEnd: supportEnd,
      hasEndOfSupportPlan: filled(p.eos_notice) || filled(p.corrective_action_procedure),
    });
  }
  return map;
}

export function emptyReadinessInput(): ReadinessInput {
  return {
    annexIComplete: false,
    annexIStarted: false,
    hasActiveSbom: false,
    raReleased: false,
    raDraft: false,
    hasArchitectureDiagram: false,
    hasAnyDiagram: false,
    techFileReleased: false,
    techFileDraft: false,
    docFinal: false,
    docDraft: false,
    ceRecorded: false,
    identitySet: false,
    userInfoComplete: false,
    userInfoPartial: false,
    monitoringCount: 0,
    securityTestCount: 0,
    hasVdpPolicy: false,
    hasSecurityContact: false,
    advisoryCount: 0,
    supplyChainCount: 0,
    hasSupportStart: false,
    hasSupportEnd: false,
    hasEndOfSupportPlan: false,
  };
}
