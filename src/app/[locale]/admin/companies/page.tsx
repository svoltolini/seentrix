import { getServiceClient } from "@/lib/admin/service";
import { monthlyRevenueForOrg } from "@/lib/admin/metrics";
import { CompaniesTable, type CompanyRow } from "./companies-table";

export const runtime = "nodejs";

interface OrgRow {
  id: string;
  name: string | null;
  country: string | null;
  plan: string | null;
  billing_interval: string | null;
  ai_boost: boolean | null;
  stripe_subscription_id: string | null;
  billing_cancel_at_period_end: boolean | null;
  created_at: string;
}

function statusOf(o: OrgRow): CompanyRow["status"] {
  if (!o.stripe_subscription_id) return "free";
  if (o.billing_cancel_at_period_end) return "canceling";
  return "active";
}

export default async function AdminCompaniesPage() {
  const svc = getServiceClient();

  const [{ data: orgData }, { data: userData }] = await Promise.all([
    svc
      .from("organizations")
      .select(
        "id, name, country, plan, billing_interval, ai_boost, stripe_subscription_id, billing_cancel_at_period_end, created_at",
      )
      .order("created_at", { ascending: false }),
    svc.from("users").select("org_id"),
  ]);

  const orgs = (orgData as OrgRow[] | null) ?? [];

  // Seat count per org.
  const seats = new Map<string, number>();
  for (const u of (userData as { org_id: string | null }[] | null) ?? []) {
    if (u.org_id) seats.set(u.org_id, (seats.get(u.org_id) ?? 0) + 1);
  }

  const rows: CompanyRow[] = orgs.map((o) => ({
    id: o.id,
    name: o.name || "Unnamed company",
    country: o.country,
    plan: (o.plan ?? "free") as CompanyRow["plan"],
    mrr: Math.round(
      monthlyRevenueForOrg({
        plan: o.plan,
        billing_interval: o.billing_interval,
        ai_boost: o.ai_boost,
        stripe_subscription_id: o.stripe_subscription_id,
      }),
    ),
    seats: seats.get(o.id) ?? 0,
    aiBoost: !!o.ai_boost,
    status: statusOf(o),
    createdAt: o.created_at,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-h4 text-foreground">
          All companies ({rows.length})
        </h2>
      </div>
      <CompaniesTable rows={rows} />
    </div>
  );
}
