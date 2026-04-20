import {
  loadOrgSettings,
  listTeamMembers,
  getCurrentUserRole,
} from "../actions";
import { createClient } from "@/lib/supabase/server";
import { TeamContent } from "./team-content";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [org, members, currentUserRole] = await Promise.all([
    loadOrgSettings(),
    listTeamMembers(),
    getCurrentUserRole(),
  ]);

  return (
    <TeamContent
      plan={org?.plan ?? "free"}
      members={members}
      currentUserId={user?.id ?? ""}
      currentUserRole={currentUserRole ?? "viewer"}
    />
  );
}

export const metadata = { title: "Team" };
