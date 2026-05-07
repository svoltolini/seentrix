"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { STATUS_CHART_COLORS } from "../../products/[productId]/constants";
import type { ChecklistProgress } from "../../products/actions";

interface Props {
  data: ChecklistProgress[];
}

const SEGMENTS = ["completed", "in_progress", "pending", "not_applicable"] as const;
type Segment = (typeof SEGMENTS)[number];

export function ChecklistProgressChart({ data }: Props) {
  const t = useTranslations("dashboard");

  if (data.length === 0) {
    return (
      <div className="rounded-md bg-muted p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
          {t("checklistProgress.eyebrow")}
        </p>
        <h2 className="mt-1 text-h5 text-foreground">
          {t("checklistProgress.title")}
        </h2>
        <p className="py-8 text-center text-xs text-muted-foreground">
          {t("checklistProgress.noData")}
        </p>
      </div>
    );
  }

  const rows = data.map((d) => {
    const total = d.completed + d.in_progress + d.pending + d.not_applicable;
    const assessable = total - d.not_applicable;
    const pct =
      assessable > 0 ? Math.round((d.completed / assessable) * 100) : 0;
    return { ...d, total, assessable, pct };
  });

  const overallAssessable = rows.reduce((s, r) => s + r.assessable, 0);
  const overallCompleted = rows.reduce((s, r) => s + r.completed, 0);
  const avgPct =
    overallAssessable > 0
      ? Math.round((overallCompleted / overallAssessable) * 100)
      : 0;

  const labels: Record<Segment, string> = {
    completed: t("checklistProgress.completed"),
    in_progress: t("checklistProgress.inProgress"),
    pending: t("checklistProgress.pending"),
    not_applicable: t("checklistProgress.notApplicable"),
  };

  return (
    <div className="overflow-hidden rounded-md bg-muted">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
            {t("checklistProgress.eyebrow")}
          </p>
          <h2 className="mt-1 text-h5 text-foreground">
            {t("checklistProgress.title")}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t("checklistProgress.summary", {
              pct: avgPct,
              count: rows.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {SEGMENTS.map((seg) => (
            <div key={seg} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_CHART_COLORS[seg] }}
              />
              <span className="text-[11px] text-muted-foreground">
                {labels[seg]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows — use the dashboard progress bar pattern */}
      <div className="divide-y divide-white/[0.04]">
        {rows.map((row) => (
          <Link
            key={row.productId}
            href={`/app/products/${row.productId}/checklist`}
            className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted"
          >
            <div className="w-48 min-w-0 shrink-0">
              <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                {row.productName}
              </p>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-3 flex-1 overflow-hidden rounded-[3px] bg-[#191919]">
                {SEGMENTS.map((seg) => {
                  const value = row[seg];
                  if (value === 0 || row.total === 0) return null;
                  const pct = (value / row.total) * 100;
                  return (
                    <div
                      key={seg}
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_CHART_COLORS[seg],
                      }}
                      title={`${labels[seg]}: ${value}`}
                    />
                  );
                })}
              </div>

              <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                <span className="text-sm font-semibold text-foreground">
                  {row.completed}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {row.assessable}
                </span>
              </div>

              <div className={cn("w-11 shrink-0 text-right")}>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {row.pct}%
                </span>
              </div>
            </div>

            <Icon
              name="arrow-right-01-stroke-rounded"
              size={16}
              className="shrink-0 text-muted-foreground transition-colors group-hover:text-muted-foreground"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
