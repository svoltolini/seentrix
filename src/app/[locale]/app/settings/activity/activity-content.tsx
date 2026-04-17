"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportActivities, type Activity } from "../actions";
import {
  Download,
  ChevronDown,
} from "lucide-react";

const EXPORT_PERIODS = [1, 6, 12] as const;

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ActivityContent({ activities }: { activities: Activity[] }) {
  const t = useTranslations("settings.activity");
  const [isPending, startTransition] = useTransition();
  const [showExportMenu, setShowExportMenu] = useState(false);

  function handleExport(months: number) {
    setShowExportMenu(false);
    startTransition(async () => {
      const csv = await exportActivities(months);
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-log-${months}m-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground/50">
            {t("subtitle")}
          </p>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={isPending}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            {t("download")}
            <ChevronDown className="size-3" />
          </Button>
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-white/[0.08] bg-card py-1 shadow-xl">
                {EXPORT_PERIODS.map((months) => (
                  <button
                    key={months}
                    onClick={() => handleExport(months)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    <Download className="size-3.5 text-muted-foreground/50" />
                    {t(`exportPeriod.${months}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] py-16 text-center">
          <p className="text-sm text-muted-foreground/50">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card">
          <div className="divide-y divide-white/[0.04]">
            {activities.map((activity) => {
              const initials = activity.actor_name
                ? activity.actor_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : (activity.actor_email?.[0] ?? "?").toUpperCase();

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3.5 px-5 py-3.5"
                >
                  {/* Avatar */}
                  {activity.actor_avatar_url ? (
                    <img
                      src={activity.actor_avatar_url}
                      alt={activity.actor_name ?? ""}
                      className="mt-0.5 size-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-muted-foreground">
                      {initials}
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.actor_name ?? activity.actor_email ?? "System"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {t.has(`actions.${activity.action}` as Parameters<typeof t>[0])
                          ? t(`actions.${activity.action}` as Parameters<typeof t>[0])
                          : activity.action.replace(".", " ")}
                      </span>
                      {activity.target_name && (
                        <>
                          {" "}
                          <span className="font-medium">
                            {activity.target_name}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/40">
                      {relativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
