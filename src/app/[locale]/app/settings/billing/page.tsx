import { getBillingInfo } from "@/lib/stripe/actions";
import { getCurrentUserRole } from "../actions";
import { BillingContent } from "./billing-content";

export default async function BillingPage() {
  const [{ billing }, currentUserRole] = await Promise.all([
    getBillingInfo(),
    getCurrentUserRole(),
  ]);

  return (
    <BillingContent
      plan={billing?.plan ?? "free"}
      billingPeriodEnd={billing?.billingPeriodEnd ?? null}
      hasSubscription={!!billing?.stripeSubscriptionId}
      isAdmin={currentUserRole === "admin"}
    />
  );
}
