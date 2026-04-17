import { getDashboardStats } from "../products/actions";
import { getIncidentWidget } from "../incidents/actions";
import { getSupportWidget } from "../products/[productId]/releases/actions";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const [stats, incidentWidget, supportWidget] = await Promise.all([
    getDashboardStats(),
    getIncidentWidget(),
    getSupportWidget(),
  ]);

  return (
    <DashboardContent
      {...stats}
      incidentWidget={incidentWidget}
      supportWidget={supportWidget}
    />
  );
}
