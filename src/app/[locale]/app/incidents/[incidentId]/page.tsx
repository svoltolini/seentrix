import { notFound } from "next/navigation";
import { getCurrentUserRole } from "../../settings/actions";
import { getOrgProductInfo } from "../../products/actions";
import { canUseEnisaFiling } from "@/lib/constants/plans";
import { getIncident } from "../actions";
import { IncidentDetailContent } from "./incident-detail-content";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; incidentId: string }>;
}) {
  const { incidentId } = await params;
  const [{ incident }, role, { plan }] = await Promise.all([
    getIncident(incidentId),
    getCurrentUserRole(),
    getOrgProductInfo(),
  ]);

  if (!incident) notFound();

  return (
    <IncidentDetailContent
      incident={incident}
      currentUserRole={role}
      canExportSrp={canUseEnisaFiling(plan)}
    />
  );
}
