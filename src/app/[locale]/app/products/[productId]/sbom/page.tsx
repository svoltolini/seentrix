import { listSboms } from "./actions";
import { SbomContent } from "./sbom-content";

export default async function SbomPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { sboms } = await listSboms(productId);

  return <SbomContent productId={productId} initialSboms={sboms} />;
}
