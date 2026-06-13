import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/entitlements";
import { canUseEnisaFiling } from "@/lib/constants/plans";
import {
  buildSrpReport,
  defaultSrpStage,
  srpFilenameStem,
  type SrpStage,
  type SrpIncident,
} from "@/lib/incident/srp-export";

/**
 * Stream a structured Article 14 report (JSON) for an incident, mirroring the
 * content the ENISA Single Reporting Platform expects.
 *
 *   GET /api/incidents/:id/srp?stage=early_warning|notification|final_report
 *
 * Stage defaults to the latest one already submitted. Gated to Business+
 * ("ENISA filing assist"). See @/lib/incident/srp-export.
 */
const VALID_STAGES: SrpStage[] = ["early_warning", "notification", "final_report"];

export async function GET(
  req: Request,
  ctx: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!canUseEnisaFiling(await getOrgPlan(supabase, orgId))) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("org_id", orgId)
    .single();
  if (!incident) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const row = incident as Record<string, unknown>;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "name, legal_name, address_line1, address_line2, postal_code, city, country, security_contact_email, contact_email, website",
    )
    .eq("id", orgId)
    .single();
  const o = (org as Record<string, string | null>) ?? {};

  // Resolve affected product names.
  const productIds = (row.affected_product_ids as string[] | null) ?? [];
  let productNames: string[] = [];
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("name")
      .in("id", productIds);
    productNames = (products ?? []).map((p) => (p as { name: string }).name);
  }

  const incidentData: SrpIncident = {
    id: row.id as string,
    type: row.type as SrpIncident["type"],
    severity: row.severity as SrpIncident["severity"],
    title: (row.title as string) ?? "",
    description: (row.description as string | null) ?? null,
    awareAt: (row.aware_at as string) ?? new Date().toISOString(),
    linkedCveId: (row.linked_cve_id as string | null) ?? null,
    earlyWarningNotes: (row.early_warning_notes as string | null) ?? null,
    incidentReportNotes: (row.incident_report_notes as string | null) ?? null,
    finalReportNotes: (row.final_report_notes as string | null) ?? null,
    earlyWarningSubmittedAt:
      (row.early_warning_submitted_at as string | null) ?? null,
    incidentReportSubmittedAt:
      (row.incident_report_submitted_at as string | null) ?? null,
    finalReportSubmittedAt:
      (row.final_report_submitted_at as string | null) ?? null,
    userNotificationSentAt:
      (row.user_notification_sent_at as string | null) ?? null,
    userNotificationContent:
      (row.user_notification_content as string | null) ?? null,
    affectedProductNames: productNames,
  };

  const url = new URL(req.url);
  const stageParam = url.searchParams.get("stage") as SrpStage | null;
  const stage =
    stageParam && VALID_STAGES.includes(stageParam)
      ? stageParam
      : defaultSrpStage(incidentData);

  const address = [
    o.address_line1,
    o.address_line2,
    [o.postal_code, o.city].filter(Boolean).join(" "),
    o.country,
  ]
    .filter(Boolean)
    .join(", ");

  const generatedAt = new Date().toISOString();
  const doc = buildSrpReport({
    incident: incidentData,
    manufacturer: {
      name: o.legal_name?.trim() || o.name || "Manufacturer",
      address: address || null,
      contact: o.security_contact_email || o.contact_email || null,
      website: o.website ?? null,
    },
    stage,
    generatedAt,
  });

  const stem = srpFilenameStem(incidentId, stage, generatedAt);
  return new NextResponse(JSON.stringify(doc, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stem}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
