import { notFound } from "next/navigation";
import { loadRiskAssessment } from "./actions";
import { RiskAssessmentContent } from "./risk-assessment-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

export default async function RiskAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { state } = await loadRiskAssessment(productId);
  if (!state) notFound();

  return (
    <>
      <ScreenTrainingBanner screenKey="risk-assessment" />
      <RiskAssessmentContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Risk Assessment" };
