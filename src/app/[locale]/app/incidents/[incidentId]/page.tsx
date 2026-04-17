import { notFound } from "next/navigation";
import { getCurrentUserRole } from "../../settings/actions";
import { getIncident } from "../actions";
import { IncidentDetailContent } from "./incident-detail-content";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; incidentId: string }>;
}) {
  const { incidentId } = await params;
  const [{ incident }, role] = await Promise.all([
    getIncident(incidentId),
    getCurrentUserRole(),
  ]);

  if (!incident) notFound();

  return (
    <IncidentDetailContent
      incident={incident}
      currentUserRole={role}
    />
  );
}
