import { notFound } from "next/navigation";
import { loadIdentity } from "./actions";
import { IdentityContent } from "./identity-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function IdentityPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { state } = await loadIdentity(productId);
  if (!state) notFound();

  return (
    <>
      <LearnScreenContext screenKey="identity" />
      <IdentityContent productId={productId} initial={state} />
    </>
  );
}

export const metadata = { title: "Identity & CE" };
