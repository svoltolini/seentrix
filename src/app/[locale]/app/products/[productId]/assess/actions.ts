"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import type { CraCategory, ConformityRoute } from "@/lib/constants/cra-classification";
import { canWrite } from "@/lib/constants/roles";
import { logActivity } from "@/lib/activity";

interface AssessmentInput {
  hasDigitalElements: boolean;
  isEuDistribution: boolean;
  excludedSectors: string[];
  subcategoryId: string | null;
  category: CraCategory;
  conformityRoute: ConformityRoute;
  requiresNotifiedBody: boolean;
}

export async function runAssessmentForProduct(
  productId: string,
  input: AssessmentInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) return { error: "notAuthenticated" };

  // Read-only viewers cannot run/overwrite a product's CRA classification.
  {
    const { data: me } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!canWrite((me as { role: string } | null)?.role))
      return { error: "notAuthorized" };
  }

  // Update product classification
  const { error: updateError } = await supabase
    .from("products")
    .update({
      cra_category: input.category,
      conformity_route: input.conformityRoute,
      requires_notified_body: input.requiresNotifiedBody,
    })
    .eq("id", productId);

  if (updateError) return { error: "generic" };

  // Delete old assessment answers for this product
  await supabase
    .from("assessment_answers")
    .delete()
    .eq("product_id", productId);

  // Insert new assessment answers
  const answers = [
    {
      product_id: productId,
      question_id: "digital_elements",
      response: "fully_implemented" as const,
      notes: String(input.hasDigitalElements),
    },
    {
      product_id: productId,
      question_id: "eu_distribution",
      response: "fully_implemented" as const,
      notes: String(input.isEuDistribution),
    },
    {
      product_id: productId,
      question_id: "excluded_sectors",
      response: "not_applicable" as const,
      notes: JSON.stringify(input.excludedSectors),
    },
    {
      product_id: productId,
      question_id: "cra_classification",
      response: "fully_implemented" as const,
      notes: input.subcategoryId ?? "default",
    },
  ];

  const { error: answersError } = await supabase
    .from("assessment_answers")
    .insert(answers);

  if (answersError) return { error: "generic" };

  await logActivity({ action: "product.assessed", targetType: "product", targetId: productId, metadata: { category: input.category } });

  return {};
}
