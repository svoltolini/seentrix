"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportActivities, type Activity } from "../actions";
import { useLocaleDate } from "@/lib/locale-date";

const EXPORT_PERIODS = [1, 6, 12] as const;

function useRelativeTime() {
  const t = useTranslations("settings.activity.relative");
  const { formatDate } = useLocaleDate();
  // Seed from Date.now() lazily so the first render is stable, then tick.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (dateStr: string) => {
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return t("justNow");
    if (diffMin < 60) return t("minutesAgo", { count: diffMin });
    if (diffHr < 24) return t("hoursAgo", { count: diffHr });
    if (diffDay < 7) return t("daysAgo", { count: diffDay });
    return formatDate(dateStr);
  };
}

/**
 * Humanize an action key when we don't have an i18n string for it —
 * "entity_obligation.updated" -> "entity obligation updated".
 */
function fallbackActionLabel(action: string): string {
  return action.replace(/[._]/g, " ");
}

export function ActivityContent({ activities }: { activities: Activity[] }) {
  const t = useTranslations("settings.activity");
  const relativeTime = useRelativeTime();
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
          <h2 className="text-h4 text-foreground">{t("title")}</h2>
          <p className="mt-1 text-p3 text-muted-foreground">
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
            <Icon name="Download" className="size-3.5" />
            {t("download")}
            <Icon name="ChevronDown" className="size-3" />
          </Button>
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-md bg-card shadow-card-md py-1">
                {EXPORT_PERIODS.map((months) => (
                  <button
                    key={months}
                    onClick={() => handleExport(months)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-p3 text-foreground transition-colors hover:bg-muted/60"
                  >
                    <Icon name="Download" className="size-3.5 text-muted-foreground" />
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
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border-outline bg-card py-16 text-center">
          <p className="text-p3 text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-md bg-card shadow-card-lg">
          <div className="divide-y divide-border">
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
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-l6-plus text-muted-foreground">
                      {initials}
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-p3">
                      <span className="text-l6 text-foreground">
                        {activity.actor_name ?? activity.actor_email ?? "System"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {t.has(`actions.${activity.action}` as Parameters<typeof t>[0])
                          ? t(`actions.${activity.action}` as Parameters<typeof t>[0])
                          : fallbackActionLabel(activity.action)}
                      </span>
                      {activity.target_name && (
                        <>
                          <span className="mx-1 text-muted-foreground">
                            ·
                          </span>
                          <span className="text-l6 text-foreground">
                            {activity.target_name}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-p4 text-muted-foreground">
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
