import { Link } from "@/i18n/navigation";
import { KpiCard } from "@/components/ui/kpi-card";
import { getServiceClient } from "@/lib/admin/service";
import { revenueSummary, planBreakdown } from "@/lib/admin/metrics";
import { listProblemSubscriptions } from "@/lib/admin/stripe";
import { formatEur, formatDate, formatNumber } from "@/lib/admin/format";

export const runtime = "nodejs";

interface OrgRow {
  id: string;
  name: string | null;
  plan: string | null;
  billing_interval: string | null;
  ai_boost: boolean | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface EventRow {
  event_id: string;
  event_type: string;
  processed_at: string | null;
}

export default async function AdminRevenuePage() {
  const svc = getServiceClient();

  const [{ data: orgData }, problems, { data: eventData }] = await Promise.all([
    svc
      .from("organizations")
      .select(
        "id, name, plan, billing_interval, ai_boost, stripe_subscription_id, stripe_customer_id",
      ),
    listProblemSubscriptions(),
    svc
      .from("stripe_events")
      .select("event_id, event_type, processed_at")
      .order("processed_at", { ascending: false })
      .limit(20),
  ]);

  const orgs = (orgData as OrgRow[] | null) ?? [];
  const events = (eventData as EventRow[] | null) ?? [];

  const { mrr, arr } = revenueSummary(orgs);
  const plans = planBreakdown(orgs);
  const paying = plans.professional + plans.business + plans.enterprise;
  const arpa = paying > 0 ? Math.round(mrr / paying) : 0;

  // Resolve problem subscriptions back to their org (for the drill-in link).
  const orgByCustomer = new Map<string, OrgRow>();
  for (const o of orgs) {
    if (o.stripe_customer_id) orgByCustomer.set(o.stripe_customer_id, o);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon="DollarCircle" label="MRR (blended)" value={formatEur(mrr)} />
        <KpiCard icon="Chart" iconTone="accent" label="ARR" value={formatEur(arr)} />
        <KpiCard
          icon="Profile2User"
          iconTone="muted"
          label="Paying customers"
          value={formatNumber(paying)}
        />
        <KpiCard
          icon="MoneyRecive"
          iconTone="success"
          label="ARPA / month"
          value={formatEur(arpa)}
          hint="Avg revenue per paying account"
        />
      </section>

      {/* Failed / dunning payments */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-h4 text-foreground">
            Failed &amp; at-risk payments
          </h2>
          <span className="text-p4 text-muted-foreground">
            Live from Stripe
          </span>
        </div>
        <div className="overflow-hidden rounded-md bg-card shadow-card-sm">
          {problems.length === 0 ? (
            <p className="p-6 text-center text-p3 text-muted-foreground">
              No failed or past-due subscriptions. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {problems.map((p) => {
                const org = orgByCustomer.get(p.customerId);
                return (
                  <li
                    key={p.subscriptionId}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-l6 text-foreground">
                        {org?.name ||
                          p.customerName ||
                          p.customerEmail ||
                          p.customerId}
                      </p>
                      <p className="truncate text-p4 text-muted-foreground">
                        {p.customerEmail ?? p.customerId}
                        {p.currentPeriodEnd
                          ? ` · period ends ${formatDate(
                              new Date(p.currentPeriodEnd * 1000).toISOString(),
                            )}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-destructive">
                        {p.status.replace(/_/g, " ")}
                      </span>
                      {org && (
                        <Link
                          href={`/admin/companies/${org.id}`}
                          className="text-p4 text-primary hover:underline"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Recent billing events */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-h4 text-foreground">
          Recent billing events
        </h2>
        <div className="overflow-hidden rounded-md bg-card shadow-card-sm">
          {events.length === 0 ? (
            <p className="p-6 text-center text-p3 text-muted-foreground">
              No Stripe events recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li
                  key={e.event_id}
                  className="flex items-center justify-between gap-4 px-5 py-2.5"
                >
                  <code className="text-p4 text-foreground">{e.event_type}</code>
                  <span className="text-p4 text-muted-foreground">
                    {e.processed_at
                      ? new Date(e.processed_at).toLocaleString("en-US")
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
