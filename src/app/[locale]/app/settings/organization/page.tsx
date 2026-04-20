import { loadOrgSettings, listTeamMembers, getCurrentUserRole } from "../actions";
import { getDeletionStatus } from "../gdpr-actions";
import { OrgSettingsContent } from "./org-settings-content";

export default async function OrganizationPage() {
  const [org, members, currentUserRole, deletion] = await Promise.all([
    loadOrgSettings(),
    listTeamMembers(),
    getCurrentUserRole(),
    getDeletionStatus(),
  ]);

  return (
    <OrgSettingsContent
      org={org}
      members={members}
      isAdmin={currentUserRole === "admin"}
      deletion={deletion}
    />
  );
}

export const metadata = { title: "Organization" };
