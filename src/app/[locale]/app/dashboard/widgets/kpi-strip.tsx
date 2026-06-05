"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/**
 * KpiStrip — a row of compact key-metric cards across the top of the dashboard
 * main column. Surfaces the numbers a compliance owner checks first: how many
 * products, average compliance, open vulnerabilities, overdue tasks, and how
 * long until the next CRA milestone.
 *
 * Each card is a real, derived figure from `DashboardStats` (no placeholders)
 * and links to the relevant section. A `tone` drives the accent colour so
 * attention-worthy metrics (open criticals, overdue work) read as warnings.
 */

export interface Kpi {
  id: string;
  label: string;
  value: string;
  /** Optional small caption under the value (e.g. "3 critical"). */
  caption?: string;
  icon: string;
  tone: "neutral" | "primary" | "success" | "warning" | "danger";
  href: string;
}

const TONE: Record<Kpi["tone"], { badge: string }> = {
  neutral: { badge: "bg-muted text-muted-foreground" },
  primary: { badge: "bg-primary/10 text-primary" },
  success: { badge: "bg-success/10 text-success" },
  warning: { badge: "bg-accent/10 text-accent" },
  danger: { badge: "bg-destructive/10 text-destructive" },
};

interface Props {
  kpis: Kpi[];
}

export function KpiStrip({ kpis }: Props) {
  const t = useTranslations("dashboard");
  if (kpis.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="sr-only">{t("kpi.heading")}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Link
            key={kpi.id}
            href={kpi.href}
            className="group flex flex-col gap-3 rounded-md bg-card p-4 shadow-card-sm transition-shadow hover:shadow-card-md"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md",
                TONE[kpi.tone].badge,
              )}
            >
              <Icon name={kpi.icon} size={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-h3 leading-none text-foreground">
                {kpi.value}
              </p>
              <p className="text-p3 text-muted-foreground">{kpi.label}</p>
              {kpi.caption && (
                <p className="mt-0.5 text-p4 text-muted-foreground">
                  {kpi.caption}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
