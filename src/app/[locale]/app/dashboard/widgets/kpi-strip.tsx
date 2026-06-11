"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * KpiStrip — the Clay stat row (design handoff §3, `.clay-stats`): four
 * white cards, each a muted 13px label on top, a big 34px serif value, and
 * a small colored caption/delta underneath. Each card links to the section
 * that explains its number.
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

const TONE_TEXT: Record<Kpi["tone"], string> = {
  neutral: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success-2",
  warning: "text-accent",
  danger: "text-destructive",
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
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.id}
            href={kpi.href}
            className="rounded-2xl border border-border bg-card px-4 py-[15px]"
          >
            <p className="text-[13px] font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-3 font-heading text-[34px] font-semibold leading-none tracking-[-0.8px] text-foreground">
              {kpi.value}
            </p>
            <p
              className={cn(
                "mt-2.5 min-h-[18px] text-[12px] font-semibold",
                TONE_TEXT[kpi.tone],
              )}
            >
              {kpi.caption ?? " "}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
