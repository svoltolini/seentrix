import { loadProduct } from "../../actions";
import { loadProductChecklist } from "../checklist-actions";
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

  const { product: checklistProduct, items } = await loadProductChecklist(productId);

  if (!checklistProduct) return null;

  return <ComplianceChecklist product={checklistProduct} initialItems={items} />;
}
