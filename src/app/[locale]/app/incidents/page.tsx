import { getCurrentUserRole } from "../settings/actions";
import { listIncidents, listOrgProducts } from "./actions";
import { IncidentsContent } from "./incidents-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";
import { RequiresProductEmptyState } from "@/components/requires-product-empty-state";

export default async function IncidentsPage() {
  const [{ incidents }, { products }, role] = await Promise.all([
    listIncidents(),
    listOrgProducts(),
    getCurrentUserRole(),
  ]);

  // Incidents are always tied to a product, so the screen has no meaning until
  // the org has registered at least one. Guide the user there instead of
  // rendering an empty incident list.
  if (products.length === 0) {
    return (
      <RequiresProductEmptyState
        namespace="incidents"
        icon="alert-02"
        title="empty.noProductTitle"
        description="empty.noProductDescription"
        ctaLabel="empty.noProductCta"
      />
    );
  }

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
