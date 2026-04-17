import { loadOrgSettings, listTeamMembers, getCurrentUserRole } from "../actions";
import { OrgSettingsContent } from "./org-settings-content";

export default async function OrganizationPage() {
  const [org, members, currentUserRole] = await Promise.all([
    loadOrgSettings(),
    listTeamMembers(),
    getCurrentUserRole(),
  ]);

  return (
    <OrgSettingsContent
      org={org}
      members={members}
      isAdmin={currentUserRole === "admin"}
    />
  );
}
