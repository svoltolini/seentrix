"use client";

import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * MeetingsList — verbatim 1:1 from Figma frame `28:1755`
 * (`data-name="Frame 162472"`, id `142:15722`).
 *
 * Layout:
 *   container 310×206, gap-20 between rows, 1px hairline separators
 *   each row 310×42:
 *     left: 42×42 icon square (`bg-muted rounded-md`) + title 16/600 +
 *           subtitle 14/500 muted
 *     right: 74×32 small CTA button ("Join")
 *
 * Used inside the dashboard right rail to list today's compliance meetings,
 * upcoming reviews, or whatever the org has configured as time-bound work.
 */

interface Meeting {
  id: string;
  title: string;
  subtitle: string;
  icon?: IconName;
  cta?: { label: string; onClick?: () => void };
}

interface Props {
  meetings: Meeting[];
  emptyMessage?: string;
}

export function MeetingsList({ meetings, emptyMessage }: Props) {
  const t = useTranslations("dashboard");

  if (meetings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-outline bg-muted px-4 py-6 text-center text-p4 text-muted-foreground">
        {emptyMessage ??
          (t.has("meetings.empty") ? t("meetings.empty") : "No meetings today.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {meetings.map((m, idx) => (
        <div key={m.id}>
          {idx > 0 && <Separator />}
          {/* Row height is content-driven (icon + 2 lines = 42px). The
              old `h-[42px]` forced the box to 42px, which then collided
              with `py-5` (20px each side) and produced ~82px rows with
              the icon overflowing — way more vertical real estate than
              the rail can spare. py-2.5 lands the row at ~62px. */}
          <div className="flex items-center gap-3 py-2.5">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-md bg-muted text-primary">
              <Icon name={m.icon ?? "VideoCircle"} size={20} />
            </span>
            <div className="flex flex-1 flex-col gap-1 truncate">
              <p className="truncate text-h6 text-foreground">{m.title}</p>
              <p className="truncate text-p3 text-muted-foreground">{m.subtitle}</p>
            </div>
            {m.cta && (
              // Per Figma: 74 × 32 px outline chip, not the default 36 px
              // `size="sm"`. Explicit `h-8 rounded-sm border-[1.5px]
              // border-border-outline` mirrors the same chip recipe used
              // by the Project Statistics filter buttons so every "small
              // pill action" in the dashboard reads as one family.
              <Button
                variant="outline"
                size="sm"
                onClick={m.cta.onClick}
                className="h-8 shrink-0 rounded-sm border-[1.5px] border-border-outline px-3 text-p3"
              >
                {m.cta.label}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
