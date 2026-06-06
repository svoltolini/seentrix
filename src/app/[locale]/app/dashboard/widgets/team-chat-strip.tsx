"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * TeamChatStrip — left-aligned list of team members in the dashboard right
 * rail. Each row is an avatar on the left with the member's name beside it,
 * all flush-left (per user request). Earlier this was a 3-column grid of
 * centred avatar-over-name tiles; the left-aligned row reads more like a
 * roster and gives long names the full rail width instead of a ~95 px tile.
 * Capped at 6 members to keep the rail compact.
 */

export interface TeamChatItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  onClick?: () => void;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

interface Props {
  members: TeamChatItem[];
}

export function TeamChatStrip({ members }: Props) {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {members.slice(0, 6).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className="group/chat-tile flex w-full min-w-0 items-center gap-3 rounded-md px-1 py-1.5 text-left outline-none transition-colors hover:bg-muted/60"
          aria-label={m.name}
        >
          <Avatar
            size="lg"
            className="size-9 shrink-0 transition-transform group-hover/chat-tile:scale-105"
          >
            <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
            <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-p3 text-foreground">
            {m.name}
          </span>
        </button>
      ))}
    </div>
  );
}
