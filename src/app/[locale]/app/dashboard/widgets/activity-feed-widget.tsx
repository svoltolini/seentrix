"use client";

import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

/**
 * ActivityFeedWidget — verbatim 1:1 from Figma frame `28:1755`
 * (`data-name="Activities"`, id `142:15783`).
 *
 * Geometry (310 wide, content list):
 *   each row: 42×42 icon-or-avatar square (left) + 256-wide message column
 *   message: title 16/700 dark + body 14/400 muted (line-clamp 2)
 *   timestamp on its own line, 14/400 muted, indented under message
 *   1px separators between rows
 *
 * Driven by Seentrix's existing `recentActivity` data shape (which already
 * includes type / actor / timestamp / target).
 */

export interface ActivityFeedItem {
  id: string;
  /** "You've been invited" / "New comment" / "Document uploaded" / etc. */
  title: string;
  /** Human-readable body line (2-line cap). */
  body: string;
  /** ISO timestamp. */
  occurredAt: string;
  /** Override: render an avatar (with fallback) instead of an icon. */
  actor?: {
    name: string | null;
    avatarUrl: string | null;
  };
  /** Override: render an icon in the icon square. */
  icon?: IconName;
  /** Background for the icon square (when `icon` is set). */
  iconTone?: "primary" | "accent" | "success" | "destructive" | "muted";
}

const TONE_BG: Record<NonNullable<ActivityFeedItem["iconTone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function formatStamp(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  items: ActivityFeedItem[];
  emptyMessage?: string;
}

export function ActivityFeedWidget({ items, emptyMessage }: Props) {
  const t = useTranslations("dashboard");

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-outline bg-muted px-4 py-6 text-center text-p4 text-muted-foreground">
        {emptyMessage ?? t("activityEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((item, idx) => (
        <div key={item.id}>
          {idx > 0 && <Separator className="mb-5" />}
          <div className="flex items-start gap-3">
            {item.actor ? (
              <Avatar size="md">
                <AvatarImage
                  src={item.actor.avatarUrl ?? undefined}
                  alt={item.actor.name ?? ""}
                />
                <AvatarFallback>{initialsOf(item.actor.name)}</AvatarFallback>
              </Avatar>
            ) : (
              <span
                className={`flex size-[42px] shrink-0 items-center justify-center rounded-md ${
                  TONE_BG[item.iconTone ?? "primary"]
                }`}
              >
                <Icon name={item.icon ?? "Notification"} size={20} variant="Bold" />
              </span>
            )}
            <div className="flex flex-1 flex-col gap-1 truncate">
              <p className="truncate text-h6 text-foreground">{item.title}</p>
              <p className="line-clamp-2 text-p3-r text-muted-foreground">
                {item.body}
              </p>
              <p className="mt-1 text-p4-r text-muted-foreground">
                {formatStamp(item.occurredAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
