"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SEVERITY_CHART_COLORS } from "../../products/[productId]/constants";
import type { VulnAgingBucket } from "../../products/actions";

interface Props {
  buckets: VulnAgingBucket[];
  mttr: number | null;
  openCount: number;
}

export function VulnAgingChart({ buckets, mttr, openCount }: Props) {
  const t = useTranslations("dashboard");

  const hasData = buckets.some(
    (b) => b.critical + b.high + b.medium + b.low > 0,
  );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      {/* Header row: open count + MTTR */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">{t("vulnAging.title")}</h2>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {openCount}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("vulnAging.openVulns")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-muted-foreground/60">
            {t("vulnAging.mttr")}
          </span>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {mttr !== null
              ? t("vulnAging.mttrDays", { days: mttr })
              : t("vulnAging.mttrNoData")}
          </p>
        </div>
      </div>

      {!hasData ? (
        <p className="py-12 text-center text-xs text-muted-foreground/50">
          {t("vulnAging.noData")}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={buckets}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={24}
          >
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload?.length) return null;
                return (
                  <div className="rounded-lg border border-white/[0.08] bg-card px-3 py-1.5 text-xs shadow-md">
                    <p className="mb-1 font-medium">{label}</p>
                    {payload
                      .filter((e) => (e.value as number) > 0)
                      .map((entry) => (
                        <div
                          key={entry.dataKey as string}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="capitalize text-muted-foreground">
                            {entry.dataKey as string}
                          </span>
                          <span className="ml-auto tabular-nums font-medium">
                            {entry.value as number}
                          </span>
                        </div>
                      ))}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="critical"
              stackId="a"
              fill={SEVERITY_CHART_COLORS.critical}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="high"
              stackId="a"
              fill={SEVERITY_CHART_COLORS.high}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="medium"
              stackId="a"
              fill={SEVERITY_CHART_COLORS.medium}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="low"
              stackId="a"
              fill={SEVERITY_CHART_COLORS.low}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
