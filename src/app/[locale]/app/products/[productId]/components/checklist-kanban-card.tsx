"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ChecklistStatus } from "@/lib/constants/cra-requirements";
import type { ChecklistAssignee } from "../checklist-actions";

/**
 * ChecklistKanbanCard — verbatim 1:1 of the Task card from Figma frame
 * `41:1171` (Detail Dashboard / Kanban). Geometry observed in
 * `data-node-id="46:1920"`:
 *   container 300×58, `bg-white rounded-[10px]`
 *   inner row: `flex gap-[14px] items-center` at left:16, top:16
 *   checkbox: 20×20, rounded-[6px], `border-[1.5px] border-[#a7aec1]`
 *   title: Plus Jakarta Sans Medium 16/1.6, `#2c3659`
 *   member stack: 24×24 avatars at right:16, top:16, overlap `mr-[-10px]`
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

const STATUS_TO_CHECK: Record<ChecklistStatus, boolean> = {
  pending: false,
  in_progress: false,
  completed: true,
  not_applicable: false,
};

interface Props {
  id: string;
  title: string;
  status: ChecklistStatus;
  assignee: ChecklistAssignee | null;
  members?: ChecklistAssignee[]; // used for the small avatar stack on the right
  onStatusChange: (id: string, status: ChecklistStatus) => void;
  onClick?: () => void;
}

export function ChecklistKanbanCard({
  id,
  title,
  status,
  assignee,
  members,
  onStatusChange,
  onClick,
}: Props) {
  const checked = STATUS_TO_CHECK[status];

  // Stack: prefer the assignee, fall back to first 3 org members so the card
  // doesn't look bare when nothing is assigned. Cap at 3 visible.
  const stack = assignee
    ? [assignee]
    : (members ?? []).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/kanban-card relative flex h-14 w-full min-h-[58px] items-center gap-3.5 rounded-md bg-card px-4 text-left transition-shadow hover:shadow-card-sm",
        status === "completed" && "opacity-60",
      )}
      data-status={status}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => {
          onStatusChange(id, next ? "completed" : "pending");
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={title}
      />
      <p
        className={cn(
          "flex-1 truncate text-p2 text-foreground",
          checked && "line-through",
        )}
      >
        {title}
      </p>
      {stack.length > 0 && (
        <div className="flex shrink-0 items-end -space-x-2.5">
          {stack.map((m) => (
            <Avatar
              key={m.id}
              size="sm"
              className="ring-2 ring-card"
            >
              <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name ?? ""} />
              <AvatarFallback>{initialsOf(m.full_name, m.email)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
    </button>
  );
}
