import { listProducts, getOrgProductInfo } from "./actions";
import { ProductsPageContent } from "./products-page-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function ProductsPage() {
  const [{ products }, orgInfo] = await Promise.all([
    listProducts(),
    getOrgProductInfo(),
  ]);

  return (
    <>
      <LearnScreenContext screenKey="products" />
      <ProductsPageContent
        products={products}
        plan={orgInfo.plan}
        canCreate={orgInfo.canCreate}
        productCount={orgInfo.productCount}
      />
    </>
  );
}

export const metadata = { title: "Products" };
