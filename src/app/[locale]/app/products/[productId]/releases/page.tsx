import { getCurrentUserRole } from "../../../settings/actions";
import { listReleases, loadProductSupport } from "./actions";
import { ReleasesContent } from "./releases-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function ReleasesPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const [{ releases }, { support }, role] = await Promise.all([
    listReleases(productId),
    loadProductSupport(productId),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <LearnScreenContext screenKey="releases" />
      <ReleasesContent
        productId={productId}
        initialReleases={releases}
        initialSupport={support}
        currentUserRole={role}
      />
    </>
  );
}

export const metadata = { title: "Releases" };
