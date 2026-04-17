"use client";

import { useTranslations } from "next-intl";
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

interface Props {
  data: ComplianceTrendPoint[];
}

export function ComplianceTrendChart({ data }: Props) {
  const t = useTranslations("dashboard");

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">
          {t("complianceTrend.title")}
        </h2>
        <p className="py-12 text-center text-xs text-muted-foreground/50">
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold">
        {t("complianceTrend.title")}
      </h2>
      <ResponsiveContainer width="100%" height={240}>
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
                <div className="rounded-lg border border-white/[0.08] bg-card px-3 py-1.5 text-xs shadow-md">
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
  );
}
