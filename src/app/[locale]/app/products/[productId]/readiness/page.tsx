import { redirect } from "next/navigation";

/**
 * CRA Readiness merged into the product Overview tab — keep deep links
 * working by redirecting to the overview, where ReadinessSection renders.
 */
export default async function ReadinessPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  redirect(`/app/products/${productId}`);
}
