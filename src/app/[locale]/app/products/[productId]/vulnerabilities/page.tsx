import { getCurrentUserRole } from "../../../settings/actions";
import { getOrgProductInfo } from "../../../products/actions";
import { hasFeature } from "@/lib/constants/plans";
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
  const [{ vulns }, { members }, role, { plan }] = await Promise.all([
    listProductVulnerabilities(productId),
    listAssignableMembers(),
    getCurrentUserRole(),
    getOrgProductInfo(),
  ]);

  return (
    <>
      <LearnScreenContext screenKey="vulnerabilities" />
      <VulnerabilitiesContent
        productId={productId}
        initialVulns={vulns}
        members={members}
        currentUserRole={role}
        canExportAdvisory={hasFeature(plan, "vex_csaf")}
      />
    </>
  );
}

export const metadata = { title: "Vulnerabilities" };
