import { getDashboardStats } from "../products/actions";
import { getIncidentWidget } from "../incidents/actions";
import { getSupportWidget } from "../products/[productId]/releases/actions";
import { getCompanyProfileStatus, getCurrentUserRole } from "../settings/actions";
import { dashboardVariant } from "@/lib/constants/roles";
import { DashboardContent } from "./dashboard-content";
import { MyWorkDashboard } from "./my-work-dashboard";
import { getMyWorkStats } from "./my-work-actions";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function DashboardPage() {
  const role = await getCurrentUserRole();

  // Editors land on the task-focused "My Work" dashboard; leadership and
  // viewers see the org-wide dashboard (viewers read-only). See roles.ts.
  if (dashboardVariant(role) === "myWork") {
    const stats = await getMyWorkStats();
    if (stats) {
      return <MyWorkDashboard stats={stats} />;
    }
    // Fall through to the org dashboard if the per-user fetch fails.
  }

  const [stats, incidentWidget, supportWidget, profileStatus, myWork] =
    await Promise.all([
      getDashboardStats(),
      getIncidentWidget(),
      getSupportWidget(),
      getCompanyProfileStatus(),
      // Leadership's own assigned work for the "My tasks" rail card.
      getMyWorkStats(),
    ]);

  return (
    <>
      <LearnScreenContext screenKey="dashboard" />
      <DashboardContent
        {...stats}
        incidentWidget={incidentWidget}
        supportWidget={supportWidget}
        profileStatus={profileStatus}
        myTasks={myWork?.tasks ?? []}
        myVulns={myWork?.vulns ?? []}
      />
    </>
  );
}

export const metadata = { title: "Dashboard" };
