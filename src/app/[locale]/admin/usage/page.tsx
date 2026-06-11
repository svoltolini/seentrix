import { Link } from "@/i18n/navigation";
import { KpiCard } from "@/components/ui/kpi-card";
import { getServiceClient } from "@/lib/admin/service";
import { monthlyRevenueForOrg } from "@/lib/admin/metrics";
import { aiCostEur } from "@/lib/admin/costs";
import { formatEur, formatNumber } from "@/lib/admin/format";

export const runtime = "nodejs";

interface OrgRow {
  id: string;
  name: string | null;
  plan: string | null;
  billing_interval: string | null;
  ai_boost: boolean | null;
  stripe_subscription_id: string | null;
}

interface UsageRow {
  org_id: string;
  message_count: number;
  tokens_in: number;
  tokens_out: number;
}

interface Combined {
  id: string;
  name: string;
  plan: string;
  messages: number;
  cost: number;
  revenue: number;
  margin: number;
}

export default async function AdminUsagePage() {
  const svc = getServiceClient();

  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: usageData }, { data: orgData }] = await Promise.all([
    svc.rpc("admin_usage_by_org", { since }),
    svc
      .from("organizations")
      .select("id, name, plan, billing_interval, ai_boost, stripe_subscription_id"),
  ]);

  const usage = (usageData as UsageRow[] | null) ?? [];
  const orgs = (orgData as OrgRow[] | null) ?? [];
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  const rows: Combined[] = usage
    .map((u) => {
      const org = orgById.get(u.org_id);
      const revenue = org
        ? monthlyRevenueForOrg({
            plan: org.plan,
            billing_interval: org.billing_interval,
            ai_boost: org.ai_boost,
            stripe_subscription_id: org.stripe_subscription_id,
          })
        : 0;
      const cost = aiCostEur(u.tokens_in, u.tokens_out);
      return {
        id: u.org_id,
        name: org?.name || "Unknown / deleted",
        plan: org?.plan ?? "free",
        messages: u.message_count,
        cost,
        revenue,
        margin: revenue - cost,
      };
    })
    .sort((a, b) => b.cost - a.cost);

  const totalMessages = rows.reduce((s, r) => s + r.messages, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const unprofitable = rows.filter((r) => r.margin < 0).length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon="MessageText1"
          label="Messages (MTD)"
          value={formatNumber(totalMessages)}
        />
        <KpiCard
          icon="Cpu"
          iconTone="accent"
          label="AI cost (MTD)"
          value={formatEur(totalCost, { cents: true })}
          hint="Mistral Large list price"
        />
        <KpiCard
          icon="DollarCircle"
          iconTone="success"
          label="Revenue from these"
          value={formatEur(Math.round(totalRevenue))}
        />
        <KpiCard
          icon="Warning2"
          iconTone={unprofitable > 0 ? "destructive" : "muted"}
          label="Unprofitable orgs"
          value={formatNumber(unprofitable)}
          hint="AI cost above plan price"
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-h4 text-foreground">
            Per-company usage &amp; margin
          </h2>
          <span className="text-p4 text-muted-foreground">
            Month to date · costs are estimates
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-card-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-l6-plus uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5 text-right">Messages</th>
                <th className="px-4 py-2.5 text-right">AI cost</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-p3 text-muted-foreground"
                  >
                    No Copilot usage this month yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="text-p3 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/companies/${r.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {r.plan}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatNumber(r.messages)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatEur(r.cost, { cents: true })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {r.revenue > 0 ? formatEur(Math.round(r.revenue)) : "—"}
                    </td>
                    <td
                      className={
                        "px-4 py-3 text-right tabular-nums " +
                        (r.margin < 0 ? "text-destructive" : "text-success")
                      }
                    >
                      {formatEur(r.margin, { cents: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
