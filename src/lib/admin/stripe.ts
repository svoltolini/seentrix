import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

/**
 * Live Stripe reads for the admin console. We store current plan state on the
 * org, but money-truth (failed payments, dunning) has to come from Stripe at
 * read time. Everything here fails soft: a Stripe outage degrades the panel to
 * empty rather than 500-ing the whole console.
 */

export interface ProblemSub {
  subscriptionId: string;
  customerId: string;
  customerEmail: string | null;
  customerName: string | null;
  status: Stripe.Subscription.Status;
  currentPeriodEnd: number | null;
}

// Statuses that mean "we're not getting paid and should chase it".
const PROBLEM_STATUSES = new Set<Stripe.Subscription.Status>([
  "past_due",
  "unpaid",
  "incomplete",
]);

function periodEnd(sub: Stripe.Subscription): number | null {
  const item = sub.items.data[0];
  return (
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    null
  );
}

export interface InvoiceRow {
  id: string;
  number: string | null;
  created: number;
  amountPaid: number; // major units (e.g. euros)
  currency: string;
  status: string | null;
  hostedUrl: string | null;
}

/** Recent invoices for one customer (billing history on the 360 view). */
export async function listRecentInvoices(
  customerId: string,
  limit = 12,
): Promise<InvoiceRow[]> {
  try {
    const list = await getStripe().invoices.list({ customer: customerId, limit });
    return list.data.map((inv) => ({
      id: inv.id ?? "",
      number: inv.number ?? null,
      created: inv.created,
      amountPaid: (inv.amount_paid ?? 0) / 100,
      currency: (inv.currency ?? "eur").toUpperCase(),
      status: inv.status ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
    }));
  } catch (e) {
    console.error("[admin] listRecentInvoices failed:", e);
    return [];
  }
}

/** Subscriptions in a dunning/failed state, newest first. */
export async function listProblemSubscriptions(): Promise<ProblemSub[]> {
  try {
    const list = await getStripe().subscriptions.list({
      status: "all",
      limit: 100,
      expand: ["data.customer"],
    });

    return list.data
      .filter((s) => PROBLEM_STATUSES.has(s.status))
      .map((s) => {
        const customer = s.customer;
        const isObj =
          customer && typeof customer === "object" && !("deleted" in customer);
        return {
          subscriptionId: s.id,
          customerId: typeof customer === "string" ? customer : customer.id,
          customerEmail: isObj ? (customer as Stripe.Customer).email : null,
          customerName: isObj ? ((customer as Stripe.Customer).name ?? null) : null,
          status: s.status,
          currentPeriodEnd: periodEnd(s),
        };
      });
  } catch (e) {
    console.error("[admin] listProblemSubscriptions failed:", e);
    return [];
  }
}
