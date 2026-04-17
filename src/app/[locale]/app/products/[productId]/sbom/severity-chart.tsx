"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import { SEVERITY_CHART_COLORS } from "../constants";

interface SeverityChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function SeverityChart({ critical, high, medium, low }: SeverityChartProps) {
  const t = useTranslations("sbom");

  const total = critical + high + medium + low;

  const data = [
    { name: t("scan.severity.critical"), value: critical, key: "critical" },
    { name: t("scan.severity.high"), value: high, key: "high" },
    { name: t("scan.severity.medium"), value: medium, key: "medium" },
    { name: t("scan.severity.low"), value: low, key: "low" },
  ].filter((d) => d.value > 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={SEVERITY_CHART_COLORS[entry.key]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const item = payload[0];
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-md">
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">
                      {item.value}
                    </span>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {total}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("scan.totalLabel")}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_CHART_COLORS[entry.key] }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
            <span className="ml-auto text-xs font-semibold tabular-nums text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
