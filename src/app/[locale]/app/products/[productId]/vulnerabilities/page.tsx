import { getCurrentUserRole } from "../../../settings/actions";
import {
  listAssignableMembers,
  listProductVulnerabilities,
} from "./actions";
import { VulnerabilitiesContent } from "./vulnerabilities-content";
import { LearnScreenContext } from "@/components/academy/learn-fab";

export default async function VulnerabilitiesPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { productId } = await params;
  const [{ vulns }, { members }, role] = await Promise.all([
    listProductVulnerabilities(productId),
    listAssignableMembers(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <LearnScreenContext screenKey="vulnerabilities" />
      <VulnerabilitiesContent
        productId={productId}
        initialVulns={vulns}
        members={members}
        currentUserRole={role}
      />
    </>
  );
}

export const metadata = { title: "Vulnerabilities" };
