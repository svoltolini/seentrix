import { getOrgProductInfo } from "../actions";
import { CreateProductForm } from "./create-product-form";

export default async function NewProductPage() {
  const orgInfo = await getOrgProductInfo();

  return (
    <div className="mx-auto max-w-2xl py-10">
      <CreateProductForm
        canCreate={orgInfo.canCreate}
        plan={orgInfo.plan}
        productCount={orgInfo.productCount}
      />
    </div>
  );
}

export const metadata = { title: "New product" };
