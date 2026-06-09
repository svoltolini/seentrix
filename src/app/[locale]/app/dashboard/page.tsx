import { getDashboardStats } from "../products/actions";
import { getIncidentWidget } from "../incidents/actions";
import { getSupportWidget } from "../products/[productId]/releases/actions";
import { getCompanyProfileStatus } from "../settings/actions";
import { getReadinessRollup } from "../products/[productId]/readiness/actions";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const [stats, incidentWidget, supportWidget, profileStatus, readinessRollup] =
    await Promise.all([
      getDashboardStats(),
      getIncidentWidget(),
      getSupportWidget(),
      getCompanyProfileStatus(),
      getReadinessRollup(),
    ]);

  return (
    <DashboardContent
      {...stats}
      incidentWidget={incidentWidget}
      supportWidget={supportWidget}
      profileStatus={profileStatus}
      readinessRollup={readinessRollup}
    />
  );
}

export const metadata = { title: "Dashboard" };
