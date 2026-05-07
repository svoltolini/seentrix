"use client";

import { useTranslations } from "next-intl";
import { useLocaleDate } from "@/lib/locale-date";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PRODUCT_LINE_COLORS,
  ORG_AVERAGE_COLOR,
} from "../../products/[productId]/constants";
import type { ComplianceTrendPoint } from "../../products/actions";

import { cn } from "@/lib/utils";

interface Props {
  data: ComplianceTrendPoint[];
  className?: string;
}

export function ComplianceTrendChart({ data, className }: Props) {
  const t = useTranslations("dashboard");
  const { formatShortMonthDay } = useLocaleDate();

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md bg-muted p-5",
          className,
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
          {t("complianceTrend.eyebrow")}
        </p>
        <h2 className="mt-1 text-h5 text-foreground">
          {t("complianceTrend.title")}
        </h2>
        <p className="py-12 text-center text-xs text-muted-foreground">
          {t("complianceTrend.noData")}
        </p>
      </div>
    );
  }

  // Group by date, with one key per product + org average
  const productIds = [...new Set(data.map((d) => d.productId))].slice(0, 5);
  const productNames: Record<string, string> = {};
  for (const d of data) {
    productNames[d.productId] = d.productName;
  }

  // Build chart data: { date, [productId]: score, avg: number }
  const dateMap = new Map<string, Record<string, number>>();
  for (const d of data) {
    if (!productIds.includes(d.productId)) continue;
    if (!dateMap.has(d.date)) dateMap.set(d.date, {});
    const row = dateMap.get(d.date)!;
    row[d.productId] = d.score;
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => {
      const values = Object.values(scores);
      const avg =
        values.length > 0
          ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
          : 0;
      return { date, ...scores, avg };
    });

  const formatDate = (dateStr: string) =>
    formatShortMonthDay(dateStr + "T00:00:00");

  return (
    <div
      className={cn(
        "flex flex-col rounded-md bg-muted p-5",
        className,
      )}
    >
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
          {t("complianceTrend.eyebrow")}
        </p>
        <h2 className="mt-1 text-h5 text-foreground">
          {t("complianceTrend.title")}
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t("complianceTrend.subtitle")}
        </p>
      </div>
      {/* Explicit pixel height — previously flex-1 + h-full was inherited
          from the 2/3 grid row, which this chart no longer sits in after
          going full-width. ResponsiveContainer renders nothing when its
          parent reports height 0, which is what was happening. */}
      <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (!payload?.length || !label) return null;
              return (
                <div className="rounded-lg bg-muted px-3 py-1.5 text-xs shadow-md">
                  <p className="mb-1 font-medium">{formatDate(String(label))}</p>
                  {payload.map((entry) => (
                    <div
                      key={entry.dataKey as string}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.dataKey === "avg"
                          ? t("complianceTrend.orgAverage")
                          : productNames[entry.dataKey as string] ??
                            entry.dataKey}
                      </span>
                      <span className="ml-auto tabular-nums font-medium">
                        {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          {productIds.map((pid, i) => (
            <Line
              key={pid}
              type="monotone"
              dataKey={pid}
              stroke={PRODUCT_LINE_COLORS[i % PRODUCT_LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              name={productNames[pid]}
            />
          ))}
          <Line
            type="monotone"
            dataKey="avg"
            stroke={ORG_AVERAGE_COLOR}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name={t("complianceTrend.orgAverage")}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
