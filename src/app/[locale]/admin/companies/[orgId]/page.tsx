import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { requirePlatformStaff } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit";
import { getServiceClient } from "@/lib/admin/service";
import { monthlyRevenueForOrg } from "@/lib/admin/metrics";
import { aiCostEur } from "@/lib/admin/costs";
import { listRecentInvoices } from "@/lib/admin/stripe";
import { formatEur, formatDate, formatNumber } from "@/lib/admin/format";

export const runtime = "nodejs";

interface OrgFull {
  id: string;
  name: string | null;
  country: string | null;
  plan: string | null;
  billing_interval: string | null;
  billing_currency: string | null;
  ai_boost: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_period_end: string | null;
  billing_cancel_at_period_end: boolean | null;
  created_at: string;
}

interface MemberRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean | null;
}

interface ActivityRow {
  id: string;
  action: string;
  actor_email: string | null;
  target_name: string | null;
  created_at: string;
}

interface UsageRow {
  org_id: string;
  message_count: number;
  tokens_in: number;
  tokens_out: number;
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const staff = await requirePlatformStaff();
  const svc = getServiceClient();

  const { data: orgData } = await svc
    .from("organizations")
    .select(
      "id, name, country, plan, billing_interval, billing_currency, ai_boost, stripe_customer_id, stripe_subscription_id, billing_period_end, billing_cancel_at_period_end, created_at",
    )
    .eq("id", orgId)
    .maybeSingle();

  const org = orgData as OrgFull | null;
  if (!org) notFound();

  // Audit the access (best-effort).
  await logAdminAction(staff, {
    action: "org.viewed",
    targetType: "organization",
    targetId: org.id,
    targetOrgId: org.id,
  });

  const [{ data: memberData }, { data: activityData }, { data: usageData }, invoices] =
    await Promise.all([
      svc
        .from("users")
        .select("id, email, full_name, role, is_active")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true }),
      svc
        .from("activities")
        .select("id, action, actor_email, target_name, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(15),
      svc.rpc("admin_usage_by_org", { since: startOfMonthIso() }),
      org.stripe_customer_id
        ? listRecentInvoices(org.stripe_customer_id)
        : Promise.resolve([]),
    ]);

  const members = (memberData as MemberRow[] | null) ?? [];
  const activities = (activityData as ActivityRow[] | null) ?? [];
  const usageRows = (usageData as UsageRow[] | null) ?? [];
  const usage = usageRows.find((u) => u.org_id === orgId);

  const mrr = Math.round(
    monthlyRevenueForOrg({
      plan: org.plan,
      billing_interval: org.billing_interval,
      ai_boost: org.ai_boost,
      stripe_subscription_id: org.stripe_subscription_id,
    }),
  );
  const aiCost = usage ? aiCostEur(usage.tokens_in, usage.tokens_out) : 0;
  const margin = mrr - aiCost;

  const status = !org.stripe_subscription_id
    ? "Free"
    : org.billing_cancel_at_period_end
      ? "Canceling"
      : "Active";

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/companies"
        className="text-p4 text-muted-foreground hover:text-foreground"
      >
        ← All companies
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-h2 text-foreground">
            {org.name || "Unnamed company"}
          </h2>
          <p className="mt-1 text-p3 text-muted-foreground">
            {org.country ? `${org.country} · ` : ""}Joined{" "}
            {formatDate(org.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-l6-plus uppercase tracking-wide text-muted-foreground">
            {org.plan ?? "free"}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-l6-plus uppercase tracking-wide text-primary">
            {status}
          </span>
        </div>
      </div>

      {/* Billing + margin snapshot */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="MRR" value={mrr > 0 ? formatEur(mrr) : "—"} />
        <Stat
          label="AI cost (MTD)"
          value={formatEur(aiCost, { cents: true })}
          tone={aiCost > mrr && mrr > 0 ? "negative" : "neutral"}
        />
        <Stat
          label="Margin (MTD)"
          value={formatEur(margin, { cents: true })}
          tone={margin < 0 ? "negative" : "positive"}
        />
        <Stat
          label="Messages (MTD)"
          value={usage ? formatNumber(usage.message_count) : "0"}
        />
      </section>

      {/* Billing details */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Interval" value={org.billing_interval ?? "—"} />
        <Detail
          label="Currency"
          value={(org.billing_currency ?? "—").toUpperCase()}
        />
        <Detail label="AI Boost" value={org.ai_boost ? "Yes" : "No"} />
        <Detail
          label="Renews / ends"
          value={formatDate(org.billing_period_end)}
        />
        <Detail
          label="Stripe customer"
          value={org.stripe_customer_id ?? "—"}
          mono
        />
        <Detail
          label="Subscription"
          value={org.stripe_subscription_id ?? "—"}
          mono
        />
      </section>

      {/* Members */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-h4 text-foreground">
          Members ({members.length})
        </h3>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 px-5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-l6 text-foreground">
                    {m.full_name || m.email}
                  </p>
                  <p className="truncate text-p4 text-muted-foreground">
                    {m.email}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-l6-plus uppercase tracking-wide text-muted-foreground">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Billing history */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-h4 text-foreground">Billing history</h3>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {invoices.length === 0 ? (
            <p className="p-6 text-center text-p3 text-muted-foreground">
              No invoices.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-4 px-5 py-2.5 text-p3"
                >
                  <span className="text-muted-foreground">
                    {formatDate(new Date(inv.created * 1000).toISOString())}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-foreground">
                      {inv.currency} {inv.amountPaid.toFixed(2)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-l6-plus uppercase text-muted-foreground">
                      {inv.status ?? "—"}
                    </span>
                    {inv.hostedUrl && (
                      <a
                        href={inv.hostedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recent activity */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-h4 text-foreground">Recent activity</h3>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {activities.length === 0 ? (
            <p className="p-6 text-center text-p3 text-muted-foreground">
              No recorded activity.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-5 py-2.5 text-p3"
                >
                  <span className="text-foreground">
                    <code className="text-p4 text-muted-foreground">
                      {a.action}
                    </code>
                    {a.target_name ? ` · ${a.target_name}` : ""}
                  </span>
                  <span className="shrink-0 text-p4 text-muted-foreground">
                    {a.actor_email ?? "—"} ·{" "}
                    {new Date(a.created_at).toLocaleString("en-US")}
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

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-1 text-h4 " +
          (tone === "negative"
            ? "text-destructive"
            : tone === "positive"
              ? "text-success"
              : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-l6-plus uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-0.5 truncate text-p3 text-foreground" + (mono ? " font-mono text-p4" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}
