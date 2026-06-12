import { listSboms } from "./actions";
import { SbomContent } from "./sbom-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function SbomPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { sboms } = await listSboms(productId);

  return (
    <>
      <LearnScreenContext screenKey="sbom" />
      <SbomContent productId={productId} initialSboms={sboms} />
    </>
  );
}

export const metadata = { title: "SBOM" };
