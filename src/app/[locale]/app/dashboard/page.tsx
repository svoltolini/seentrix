import { getDashboardStats } from "../products/actions";
import { getIncidentWidget } from "../incidents/actions";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const [stats, incidentWidget] = await Promise.all([
    getDashboardStats(),
    getIncidentWidget(),
  ]);

  return <DashboardContent {...stats} incidentWidget={incidentWidget} />;
}
