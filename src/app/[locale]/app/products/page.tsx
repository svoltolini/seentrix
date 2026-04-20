import { listProducts, getOrgProductInfo } from "./actions";
import { ProductsPageContent } from "./products-page-content";

export default async function ProductsPage() {
  const [{ products }, orgInfo] = await Promise.all([
    listProducts(),
    getOrgProductInfo(),
  ]);

  return (
    <ProductsPageContent
      products={products}
      plan={orgInfo.plan}
      canCreate={orgInfo.canCreate}
      productCount={orgInfo.productCount}
    />
  );
}

export const metadata = { title: "Products" };
