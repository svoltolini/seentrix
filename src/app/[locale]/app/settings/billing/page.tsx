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
      billingInterval={billing?.billingInterval ?? null}
      cancelAtPeriodEnd={billing?.cancelAtPeriodEnd ?? false}
      hasSubscription={!!billing?.stripeSubscriptionId}
      hasCustomer={!!billing?.stripeCustomerId}
      isAdmin={currentUserRole === "admin"}
    />
  );
}

export const metadata = { title: "Billing" };
