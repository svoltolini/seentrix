import { loadProduct } from "../actions";
import { ProductDetailShell } from "./product-detail-shell";

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const { product } = await loadProduct(productId);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-lg font-medium text-foreground">
          Product not found
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The product you are looking for does not exist or you do not have
          access.
        </p>
      </div>
    );
  }

  return (
    <ProductDetailShell product={product} productId={productId}>
      {children}
    </ProductDetailShell>
  );
}
