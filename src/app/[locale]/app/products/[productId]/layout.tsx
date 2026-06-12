import { loadProduct } from "../actions";
import { getCurrentUserRole } from "../../settings/actions";
import { canWrite } from "@/lib/constants/roles";
import { ProductDetailShell } from "./product-detail-shell";

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const [{ product }, role] = await Promise.all([
    loadProduct(productId),
    getCurrentUserRole(),
  ]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-h3 text-foreground">
          Product not found
        </h1>
        <p className="mt-1 text-p2-r text-muted-foreground">
          The product you are looking for does not exist or you do not have
          access.
        </p>
      </div>
    );
  }

  return (
    <ProductDetailShell
      product={product}
      productId={productId}
      canWrite={canWrite(role)}
    >
      {children}
    </ProductDetailShell>
  );
}
