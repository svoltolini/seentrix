import { getOrgProductInfo } from "../actions";
import { CreateProductForm } from "./create-product-form";

export default async function NewProductPage() {
  const orgInfo = await getOrgProductInfo();

  return (
    <div className="mx-auto max-w-lg py-8">
      <CreateProductForm
        canCreate={orgInfo.canCreate}
        plan={orgInfo.plan}
        productCount={orgInfo.productCount}
      />
    </div>
  );
}
