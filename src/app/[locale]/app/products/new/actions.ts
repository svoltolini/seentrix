"use server";

import { createClient } from "@/lib/supabase/server";
import { assessmentSchema } from "@/lib/validations/assessment";
import { classifyProduct } from "@/lib/constants/cra-classification";
import { logActivity } from "@/lib/activity";
import { canCreateProduct, type OrgPlan } from "@/lib/constants/plans";

export type AssessmentState =
  | { productId: string; error?: never }
  | { error: string; productId?: never }
  | undefined;

export async function createProductWithAssessment(
  locale: string,
  _prevState: AssessmentState,
  formData: FormData
): Promise<AssessmentState> {
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: (formData.get("description") as string) || undefined,
    hasDigitalElements: formData.get("hasDigitalElements") === "true",
    isEuDistribution: formData.get("isEuDistribution") === "true",
    excludedSectors: JSON.parse(
      (formData.get("excludedSectors") as string) || "[]"
    ),
    subcategoryId: (formData.get("subcategoryId") as string) || null,
  };

  const result = assessmentSchema.safeParse(raw);
  if (!result.success) {
    return { error: "generic" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "notAuthenticated" };
  }

  const orgId = user.app_metadata?.org_id;
  if (!orgId) {
    return { error: "noOrganization" };
  }

  // Server-side plan-limit enforcement — mirror createMember in settings.
  // Fetch the org plan + current product count and refuse past the cap so
  // a direct POST can't blow past the quota. The UI already prevents this
  // for normal navigation; this is the defence-in-depth guard.
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();
  const plan = ((org as { plan?: string } | null)?.plan ?? "free") as OrgPlan;
  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (!canCreateProduct(plan, productCount ?? 0)) {
    return { error: "planLimitReached" };
  }

  const classification = classifyProduct(result.data.subcategoryId);

  // Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      org_id: orgId,
      name: result.data.name,
      type: result.data.type,
      description: result.data.description ?? null,
      cra_category: classification.category,
      conformity_route: classification.conformityRoute,
      requires_notified_body: classification.requiresNotifiedBody,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: "generic" };
  }

  // Insert assessment answers
  const answers = [
    {
      product_id: product.id,
      question_id: "digital_elements",
      response: "fully_implemented" as const,
      notes: String(result.data.hasDigitalElements),
    },
    {
      product_id: product.id,
      question_id: "eu_distribution",
      response: "fully_implemented" as const,
      notes: String(result.data.isEuDistribution),
    },
    {
      product_id: product.id,
      question_id: "excluded_sectors",
      response: "not_applicable" as const,
      notes: JSON.stringify(result.data.excludedSectors),
    },
    {
      product_id: product.id,
      question_id: "cra_classification",
      response: "fully_implemented" as const,
      notes: result.data.subcategoryId ?? "default",
    },
  ];

  const { error: answersError } = await supabase
    .from("assessment_answers")
    .insert(answers);

  if (answersError) {
    // Clean up product if answers fail
    await supabase.from("products").delete().eq("id", product.id);
    return { error: "generic" };
  }

  await logActivity({ action: "product.assessed", targetType: "product", targetId: product.id, targetName: result.data.name, metadata: { category: classification.category } });

  return { productId: product.id };
}
