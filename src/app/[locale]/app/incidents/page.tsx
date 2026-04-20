import { getCurrentUserRole } from "../settings/actions";
import { listIncidents, listOrgProducts } from "./actions";
import { IncidentsContent } from "./incidents-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

export default async function IncidentsPage() {
  const [{ incidents }, { products }, role] = await Promise.all([
    listIncidents(),
    listOrgProducts(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <ScreenTrainingBanner screenKey="incidents" />
      <IncidentsContent
        initialIncidents={incidents}
        products={products}
        currentUserRole={role}
      />
    </>
  );
}

export const metadata = { title: "Incidents" };
