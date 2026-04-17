import { getCurrentUserRole } from "../settings/actions";
import { listIncidents, listOrgProducts } from "./actions";
import { IncidentsContent } from "./incidents-content";

export default async function IncidentsPage() {
  const [{ incidents }, { products }, role] = await Promise.all([
    listIncidents(),
    listOrgProducts(),
    getCurrentUserRole(),
  ]);

  return (
    <IncidentsContent
      initialIncidents={incidents}
      products={products}
      currentUserRole={role}
    />
  );
}
