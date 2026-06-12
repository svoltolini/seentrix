import {
  loadOrgSettings,
  listTeamMembers,
  getCurrentUserRole,
} from "../actions";
import { getAuthUser } from "@/lib/supabase/server";
import { TeamContent } from "./team-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function TeamPage() {
  const [user, org, members, currentUserRole] = await Promise.all([
    getAuthUser(),
    loadOrgSettings(),
    listTeamMembers(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <LearnScreenContext screenKey="settingsTeam" />
      <TeamContent
        plan={org?.plan ?? "free"}
        members={members}
        currentUserId={user?.id ?? ""}
        currentUserRole={currentUserRole ?? "viewer"}
      />
    </>
  );
}

export const metadata = { title: "Team" };
