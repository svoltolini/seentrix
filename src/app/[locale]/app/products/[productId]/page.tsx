import { loadProduct } from "../actions";
import { getCurrentUserRole } from "../../settings/actions";
import { canWrite } from "@/lib/constants/roles";
import { ProductOverview } from "./product-overview";
import { ReadinessSection } from "./readiness/readiness-section";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  const [{ product }, role] = await Promise.all([
    loadProduct(productId),
    getCurrentUserRole(),
  ]);

  if (!product) {
    return null; // Layout handles the not-found case
  }

  // Get compliance score from checklist items
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("checklist_items")
    .select("status")
    .eq("product_id", productId);

  let complianceScore = 0;
  if (items && items.length > 0) {
    const applicable = items.filter((i) => i.status !== "not_applicable");
    const completed = applicable.filter((i) => i.status === "completed");
    complianceScore = applicable.length > 0
      ? Math.round((completed.length / applicable.length) * 100)
      : 0;
  }

  return (
    <div className="space-y-[18px]">
      <ProductOverview
        product={product}
        complianceScore={complianceScore}
        hasChecklist={!!items && items.length > 0}
        canWrite={canWrite(role)}
      />
      {/* CRA Readiness — merged into the Overview tab */}
      <ReadinessSection locale={locale} productId={productId} />
    </div>
  );
}
