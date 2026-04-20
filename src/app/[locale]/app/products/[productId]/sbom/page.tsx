import { listSboms } from "./actions";
import { SbomContent } from "./sbom-content";
import { ScreenTrainingBanner } from "@/components/screen-training-banner";

export default async function SbomPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { sboms } = await listSboms(productId);

  return (
    <>
      <ScreenTrainingBanner screenKey="sbom" />
      <SbomContent productId={productId} initialSboms={sboms} />
    </>
  );
}

export const metadata = { title: "SBOM" };
