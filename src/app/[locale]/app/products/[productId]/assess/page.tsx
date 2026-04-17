import { loadProduct } from "../../actions";
import { AssessExistingProduct } from "./assess-existing-product";

export default async function AssessPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  const { product } = await loadProduct(productId);

  if (!product) return null;

  return <AssessExistingProduct product={product} locale={locale} />;
}
