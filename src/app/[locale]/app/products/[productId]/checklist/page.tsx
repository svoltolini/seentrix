import { loadProduct } from "../../actions";
import { getCurrentUserRole } from "../../../settings/actions";
import { canWrite } from "@/lib/constants/roles";
import {
  listChecklistAssignees,
  loadProductChecklist,
} from "../checklist-actions";
import { ComplianceChecklist } from "../compliance-checklist";
import { ChecklistGate } from "./checklist-gate";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { product } = await loadProduct(productId);

  if (!product) return null;

  // Gate: must complete assessment first
  if (!product.cra_category) {
    return <ChecklistGate productId={productId} />;
  }

  const [{ product: checklistProduct, items }, { members }, role] =
    await Promise.all([
      loadProductChecklist(productId),
      listChecklistAssignees(),
      getCurrentUserRole(),
    ]);

  if (!checklistProduct) return null;

  return (
    <ComplianceChecklist
      product={checklistProduct}
      initialItems={items}
      members={members}
      editable={canWrite(role)}
    />
  );
}

export const metadata = { title: "Checklist" };
