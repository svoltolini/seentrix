"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ActivityVelocityPoint } from "../../products/actions";

interface Props {
  data: ActivityVelocityPoint[];
}

export function ActivityVelocityChart({ data }: Props) {
  const t = useTranslations("dashboard");

  const totalActions = data.reduce((s, d) => s + d.count, 0);
  const hasData = totalActions > 0;

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold">
          {t("activityVelocity.title")}
        </h2>
        <p className="py-12 text-center text-xs text-muted-foreground/50">
          {t("activityVelocity.noData")}
        </p>
      </div>
    );
  }

  // Peak day — used for a subtle callout under the title
  const peak = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data[0],
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            {t("activityVelocity.title")}
          </h2>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {totalActions}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("activityVelocity.totalLast30d")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-muted-foreground/60">
            {t("activityVelocity.peak")}
          </span>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {peak.count}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {formatDate(peak.date)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.25}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            dy={4}
            minTickGap={40}
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
              if (!payload?.length || !label) return null;
              const count = payload[0].value as number;
              return (
                <div className="rounded-lg border border-white/[0.08] bg-card px-3 py-1.5 text-xs shadow-md">
                  <p className="font-medium">{formatDate(String(label))}</p>
                  <p className="tabular-nums text-muted-foreground">
                    {t("activityVelocity.actions", { count })}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#activityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
