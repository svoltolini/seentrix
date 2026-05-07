import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePdfBuffer } from "@/lib/pdf/generate";

/**
 * Stream an incident-report PDF built from the live incident record.
 * Uses the existing /lib/pdf/templates/incident-report.tsx template, which
 * is already structured in the Article 14 phase A/B/C layout.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ incidentId: string }> },
) {
  const { incidentId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("org_id", orgId)
    .single();
  if (!incident) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const row = incident as Record<string, string | null>;
  const awareAt = row.aware_at
    ? new Date(row.aware_at).toLocaleDateString()
    : "";
  const notifiedAt = row.user_notification_sent_at
    ? new Date(row.user_notification_sent_at).toLocaleDateString()
    : "";

  const content = JSON.stringify({
    incidentTitle: row.title ?? "",
    incidentDate: awareAt,
    incidentDescription:
      row.incident_report_notes ??
      row.early_warning_notes ??
      row.description ??
      "",
    impactAssessment: row.incident_report_notes ?? "",
    mitigationActions: row.final_report_notes ?? "",
    notificationDate: notifiedAt,
  });

  const buffer = await generatePdfBuffer({
    documentType: "incident_report",
    content,
    locale: "en",
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="incident-${incidentId.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
