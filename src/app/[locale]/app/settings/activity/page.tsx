import { listActivities } from "../actions";
import { ActivityContent } from "./activity-content";

export default async function ActivityPage() {
  const activities = await listActivities();

  return <ActivityContent activities={activities} />;
}

export const metadata = { title: "Activity log" };
