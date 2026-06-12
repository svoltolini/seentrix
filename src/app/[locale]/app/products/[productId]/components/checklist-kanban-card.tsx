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
  assignees: ChecklistAssignee[];
}

export function ChecklistKanbanCard({ title, article, status, assignees }: Props) {
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
      {assignees.length > 0 && (
        <span className="flex shrink-0 -space-x-2">
          {assignees.slice(0, 3).map((a) => (
            <Avatar
              key={a.id}
              size="sm"
              className="ring-2 ring-card"
              title={a.full_name ?? a.email ?? undefined}
            >
              <AvatarImage src={a.avatar_url ?? undefined} alt={a.full_name ?? ""} />
              <AvatarFallback>{initialsOf(a.full_name, a.email)}</AvatarFallback>
            </Avatar>
          ))}
        </span>
      )}
    </div>
  );
}
