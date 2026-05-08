"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import {
  getRecentNotifications,
  type NotificationItem,
} from "@/lib/notifications";
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "@/lib/time";

/**
 * Topbar notification bell + popover.
 *
 * Wires to `getRecentNotifications()` (last 10 activity rows for the
 * current org). Click → popover opens → unread badge clears.
 *
 * "Unread" is tracked client-side only: a localStorage timestamp of
 * the last time the popover was opened. Any activity row newer than
 * that timestamp counts as unread and lights the red dot. Cheap MVP
 * — a future iteration can promote this to a per-user `read_at`
 * column with proper multi-device sync.
 */

const STORAGE_KEY = "seentrix:notifications:lastSeenAt";

function readLastSeen(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    // private-mode Safari throws; treat as everything-read.
    return Date.now();
  }
}

function writeLastSeen(now = new Date()): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, now.toISOString());
  } catch {
    // ignore — best-effort
  }
}

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeAgo(iso: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MS_PER_MINUTE) {
    return t.has("dashboard.timeAgo.justNow")
      ? t("dashboard.timeAgo.justNow")
      : "just now";
  }
  if (diff < MS_PER_HOUR) {
    const m = Math.floor(diff / MS_PER_MINUTE);
    return t.has("dashboard.timeAgo.minutesAgo")
      ? t("dashboard.timeAgo.minutesAgo", { count: m.toString() })
      : `${m}m ago`;
  }
  if (diff < MS_PER_DAY) {
    const h = Math.floor(diff / MS_PER_HOUR);
    return t.has("dashboard.timeAgo.hoursAgo")
      ? t("dashboard.timeAgo.hoursAgo", { count: h.toString() })
      : `${h}h ago`;
  }
  const d = Math.floor(diff / MS_PER_DAY);
  return t.has("dashboard.timeAgo.daysAgo")
    ? t("dashboard.timeAgo.daysAgo", { count: d.toString() })
    : `${d}d ago`;
}

/**
 * Convert an action key + target into a human sentence, mirroring the
 * dashboard activity widget's humanizer. Looked up against
 * `dashboard.actionLabels.*` so the strings stay in one place.
 */
function humanize(
  action: string,
  target: string | null,
  t: ReturnType<typeof useTranslations>,
): string {
  const labelKey = `dashboard.actionLabels.${action}`;
  if (t.has(labelKey)) {
    return t(labelKey, { target: target?.trim() || "—" });
  }
  return t("dashboard.actionLabels.fallback", {
    action: action.replace(/[._]/g, " "),
  });
}

export function NotificationsMenu() {
  const t = useTranslations();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  // Mounted gate — we don't want SSR to render a "0 unread" dot before
  // the client has had a chance to read localStorage and decide.
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    getRecentNotifications()
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        const lastSeen = readLastSeen();
        setHasUnread(
          rows.some((r) => new Date(r.created_at).getTime() > lastSeen),
        );
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleOpenChange(open: boolean) {
    if (open) {
      // Mark as seen on open. Optimistic — clears the dot immediately,
      // localStorage write is best-effort.
      writeLastSeen();
      setHasUnread(false);
    }
  }

  const bellLabel = t("topbar.notifications") ?? "Notifications";
  const titleLabel = t.has("topbar.notificationsTitle")
    ? t("topbar.notificationsTitle")
    : "Notifications";
  const emptyLabel = t.has("topbar.notificationsEmpty")
    ? t("topbar.notificationsEmpty")
    : "You're all caught up.";
  const viewAllLabel = t.has("topbar.notificationsViewAll")
    ? t("topbar.notificationsViewAll")
    : "View all activity";

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={bellLabel}
            className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-card text-foreground transition-colors hover:bg-muted"
          />
        }
      >
        <Icon name="Notification" size={22} />
        {hasUnread && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 inline-flex size-2 rounded-full bg-destructive ring-2 ring-card"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] overflow-hidden p-0">
        {/* Popover header */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-h5 text-foreground">{titleLabel}</p>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {!loaded ? (
          <div className="px-4 py-6 text-center text-p3 text-muted-foreground">
            {t.has("topbar.notificationsLoading")
              ? t("topbar.notificationsLoading")
              : "Loading…"}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Icon
              name="TickCircle"
              size={28}
              variant="Bold"
              className="mx-auto mb-2 text-success"
            />
            <p className="text-p3 text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 border-b border-border last:border-b-0 px-4 py-3 transition-colors hover:bg-muted"
              >
                <Avatar size="default" className="shrink-0">
                  <AvatarImage
                    src={item.user_avatar_url ?? undefined}
                    alt={item.user_name ?? ""}
                  />
                  <AvatarFallback>{initialsOf(item.user_name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-p3 text-foreground">
                    <span className="font-semibold">
                      {item.user_name ?? "System"}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-p3-r text-muted-foreground">
                    {humanize(item.action, item.target_name, t)}
                  </p>
                  <p className="text-p4-r text-muted-foreground">
                    {formatTimeAgo(item.created_at, t)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />

        <Link
          href="/app/dashboard"
          className="block px-4 py-3 text-center text-p3 text-primary transition-colors hover:bg-muted"
        >
          {viewAllLabel}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
