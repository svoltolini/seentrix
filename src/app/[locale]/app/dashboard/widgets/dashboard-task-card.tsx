"use client";

import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * DashboardTaskCard — verbatim 1:1 of the "Task Card" from Figma frame
 * `28:1755` (`data-node-id="28:2535"` / `28:2536`, frame 700×121).
 *
 * Layout:
 *   container 700×121, `bg-card rounded-[10px] shadow-card-sm`
 *   inner padding 18
 *   left column (362 wide): Task Title (subtitle 14/400 muted + title 16/700)
 *     followed by 3 meta chips (message / link / clock) at gap-16
 *     each chip: `bg-muted rounded-[8px] px-2 py-1.5`, 16×16 icon + 14/500 label
 *   right column: avatar stack (overlapping) + more icon top-right
 */

export interface DashboardTask {
  id: string;
  /** Project / context label. */
  subtitle: string;
  /** Primary task title. */
  title: string;
  href?: string;
  meta: {
    comments?: number;
    attachments?: number;
    timeLeft?: string;
  };
  members?: { id: string; name: string; avatarUrl: string | null }[];
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function DashboardTaskCard({ task }: { task: DashboardTask }) {
  const Wrapper: React.ElementType = task.href ? Link : "div";
  const wrapperProps = task.href ? { href: task.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="relative flex h-[121px] w-full flex-col rounded-md bg-card p-[18px] shadow-card-sm transition-shadow hover:shadow-card-md"
    >
      <button
        type="button"
        aria-label="More"
        className="absolute right-[18px] top-[18px] inline-flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon name="More" size={20} />
      </button>

      <div className="flex h-full items-end justify-between gap-3">
        <div className="flex h-full flex-1 flex-col justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-p3-r text-muted-foreground">{task.subtitle}</p>
            <p className="truncate text-h5 text-foreground">{task.title}</p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            {task.meta.comments !== undefined && (
              <MetaChip icon="Message">
                {task.meta.comments} {task.meta.comments === 1 ? "comment" : "comments"}
              </MetaChip>
            )}
            {task.meta.attachments !== undefined && (
              <MetaChip icon="Link1">
                {task.meta.attachments} {task.meta.attachments === 1 ? "attachment" : "attachments"}
              </MetaChip>
            )}
            {task.meta.timeLeft && <MetaChip icon="Clock">{task.meta.timeLeft}</MetaChip>}
          </div>
        </div>

        {task.members && task.members.length > 0 && (
          <div className="flex shrink-0 items-end -space-x-2.5">
            {task.members.slice(0, 3).map((m) => (
              <Avatar key={m.id} size="md" className="ring-2 ring-card">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function MetaChip({
  icon,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-muted px-2 text-p3 text-muted-foreground">
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}
