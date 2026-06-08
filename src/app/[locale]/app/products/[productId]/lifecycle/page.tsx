import { notFound } from "next/navigation";
import { loadLifecycle } from "./actions";
import { LifecycleContent } from "./lifecycle-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

export default async function LifecyclePage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { state } = await loadLifecycle(productId);
  if (!state) notFound();

  return (
    <>
      <ScreenTrainingBanner screenKey="lifecycle" />
      <LifecycleContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Lifecycle & Supply Chain" };
