import { getDashboardStats } from "../products/actions";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardContent {...stats} />;
}
