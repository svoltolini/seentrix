import { getDashboardStats } from "../products/actions";
import { getIncidentWidget } from "../incidents/actions";
import { getSupportWidget } from "../products/[productId]/releases/actions";
import { getCompanyProfileStatus } from "../settings/actions";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const [stats, incidentWidget, supportWidget, profileStatus] =
    await Promise.all([
      getDashboardStats(),
      getIncidentWidget(),
      getSupportWidget(),
      getCompanyProfileStatus(),
    ]);

  return (
    <DashboardContent
      {...stats}
      incidentWidget={incidentWidget}
      supportWidget={supportWidget}
      profileStatus={profileStatus}
    />
  );
}
