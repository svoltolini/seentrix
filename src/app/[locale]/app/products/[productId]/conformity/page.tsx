import { notFound } from "next/navigation";
import { getCurrentUserRole } from "../../../settings/actions";
import { loadConformity } from "./actions";
import { ConformityContent } from "./conformity-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function ConformityPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const [{ state }, role] = await Promise.all([
    loadConformity(productId),
    getCurrentUserRole(),
  ]);

  if (!state) notFound();

  return (
    <>
      <LearnScreenContext screenKey="conformity" />
      <ConformityContent
        productId={productId}
        initial={state}
        currentUserRole={role}
      />
    </>
  );
}

export const metadata = { title: "Conformity" };
