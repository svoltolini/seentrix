"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChecklistStatus } from "@/lib/constants/cra-requirements";
import type { ChecklistAssignee } from "../checklist-actions";

/**
 * ChecklistKanbanCard — read-only card on the checklist kanban board:
 * full requirement title (wraps, never truncates), the article reference
 * underneath, and the assignee's avatar when one is set. All editing
 * happens in the List view.
 */

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  return src
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface Props {
  title: string;
  article: string | null;
  status: ChecklistStatus;
  assignee: ChecklistAssignee | null;
}

export function ChecklistKanbanCard({ title, article, status, assignee }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[10px] border border-border bg-card px-4 py-3",
        status === "completed" && "opacity-70",
      )}
      data-status={status}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13.5px] font-semibold leading-snug text-foreground",
            status === "completed" && "text-muted-foreground line-through",
          )}
        >
          {title}
        </p>
        {article && (
          <p className="mt-1 text-p4 text-muted-foreground">{article}</p>
        )}
      </div>
      {assignee && (
        <Avatar
          size="sm"
          className="shrink-0"
          title={assignee.full_name ?? assignee.email ?? undefined}
        >
          <AvatarImage
            src={assignee.avatar_url ?? undefined}
            alt={assignee.full_name ?? ""}
          />
          <AvatarFallback>
            {initialsOf(assignee.full_name, assignee.email)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
