"use client";

import { useLocale, useTranslations } from "next-intl";
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
  // Pin the locale so server and client render the date identically; using
  // `undefined` falls back to Node's default on the server and the user's
  // browser default on the client, which causes a hydration mismatch.
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-DE" : "en-US";

  const totalActions = data.reduce((s, d) => s + d.count, 0);
  const hasData = totalActions > 0;

  if (!hasData) {
    return (
      <div className="rounded-md bg-muted p-6">
        <p className="text-l6-plus uppercase tracking-[2.5px] text-primary">
          {t("activityVelocity.eyebrow")}
        </p>
        <h2 className="mt-1 text-h5 text-foreground">
          {t("activityVelocity.title")}
        </h2>
        <p className="py-12 text-center text-p4 text-muted-foreground">
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
    return d.toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-md bg-muted p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-l6-plus uppercase tracking-[2.5px] text-primary">
            {t("activityVelocity.eyebrow")}
          </p>
          <h2 className="mt-1 text-h5 text-foreground">
            {t("activityVelocity.title")}
          </h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-h2 tabular-nums text-foreground">
              {totalActions}
            </span>
            <span className="text-p4 text-muted-foreground">
              {t("activityVelocity.totalLast30d")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-p4 text-muted-foreground">
            {t("activityVelocity.peak")}
          </span>
          <p className="text-h4 tabular-nums text-foreground">
            {peak.count}
          </p>
          <p className="text-p4 text-muted-foreground">
            {formatDate(peak.date)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
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
                <div className="rounded-md bg-card px-3 py-1.5 text-p4 shadow-card-sm">
                  <p className="text-p4 text-foreground">{formatDate(String(label))}</p>
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
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#activityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
