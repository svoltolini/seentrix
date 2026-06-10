import { Link } from "@/i18n/navigation";
import { KpiCard } from "@/components/ui/kpi-card";
import { getServiceClient } from "@/lib/admin/service";
import { revenueSummary, planBreakdown } from "@/lib/admin/metrics";
import { formatEur, formatDate } from "@/lib/admin/format";

export const runtime = "nodejs";

interface OrgRow {
  id: string;
  name: string | null;
  plan: string | null;
  billing_interval: string | null;
  ai_boost: boolean | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export default async function AdminOverviewPage() {
  const svc = getServiceClient();

  const { data } = await svc
    .from("organizations")
    .select(
      "id, name, plan, billing_interval, ai_boost, stripe_subscription_id, created_at",
    )
    .order("created_at", { ascending: false });

  const orgs = (data as OrgRow[] | null) ?? [];

  const { mrr, arr } = revenueSummary(orgs);
  const plans = planBreakdown(orgs);
  const paid = plans.professional + plans.business + plans.enterprise;
  const boosted = orgs.filter((o) => o.ai_boost).length;

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const newThisMonth = orgs.filter((o) => o.created_at >= startOfMonth).length;

  const recent = orgs.slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon="DollarCircle"
          label="MRR (blended)"
          value={formatEur(mrr)}
          hint="From stored billing state"
        />
        <KpiCard icon="Chart" iconTone="accent" label="ARR" value={formatEur(arr)} />
        <KpiCard
          icon="Building"
          iconTone="muted"
          label="Companies"
          value={orgs.length.toLocaleString()}
          hint={`${newThisMonth} new this month`}
        />
        <KpiCard
          icon="Verify"
          iconTone="success"
          label="Paying customers"
          value={paid.toLocaleString()}
          hint={`${boosted} with AI Boost`}
        />
      </section>

      {/* Plan breakdown */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PlanTile label="Free" value={plans.free} />
        <PlanTile label="Professional" value={plans.professional} />
        <PlanTile label="Business" value={plans.business} />
        <PlanTile label="Enterprise" value={plans.enterprise} />
      </section>

      {/* Recent signups */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-h4 text-foreground">Recent signups</h2>
          <Link
            href="/admin/companies"
            className="text-p4 text-primary hover:underline"
          >
            View all companies →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-card shadow-card-sm">
          {recent.length === 0 ? (
            <p className="p-6 text-center text-p3 text-muted-foreground">
              No companies yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-l6 text-foreground">
                      {o.name || "Unnamed company"}
                    </p>
                    <p className="text-p4 text-muted-foreground">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground">
                    {o.plan ?? "free"}
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

function PlanTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted p-4">
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-h3 text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
