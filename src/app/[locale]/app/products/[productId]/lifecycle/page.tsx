import { notFound } from "next/navigation";
import { loadLifecycle } from "./actions";
import { LifecycleContent } from "./lifecycle-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

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
      <LearnScreenContext screenKey="lifecycle" />
      <LifecycleContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Lifecycle & Supply Chain" };
