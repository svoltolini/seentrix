"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * TeamChatStrip — horizontal contact strip in the dashboard right rail.
 *
 * Originally a verbatim port of Figma frame `142:15825` — 46×46 avatars
 * inside a fixed `w-[46px]` wrapper, 20 px gaps. That truncated any
 * first name longer than ~6 characters because the wrapper width was
 * locked to the avatar.
 *
 * Now: 40 px avatars, no fixed wrapper width, the cell sizes to its
 * name label (capped via flexbox so 5 of them still fit in the 322 px
 * rail). Separator gap dropped from 20 → 12 to give names room to
 * breathe without overflowing.
 *
 * Layout math for 5 tiles in a 322 px-wide rail:
 *   5 × ~52 px tiles + 4 × 12 px gaps = ~308 px → fits with 14 px slack.
 */

export interface TeamChatItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  onClick?: () => void;
}

function firstName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[0] ?? full;
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
    <div className="flex items-start justify-between gap-3">
      {members.slice(0, 5).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className="group/chat-tile flex min-w-0 flex-1 flex-col items-center gap-2 outline-none"
          aria-label={m.name}
        >
          <Avatar
            size="lg"
            className="size-10 shrink-0 transition-transform group-hover/chat-tile:scale-105"
          >
            <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
            <AvatarFallback>{initialsOf(m.name)}</AvatarFallback>
          </Avatar>
          <span className="w-full truncate text-center text-p3 text-muted-foreground">
            {firstName(m.name)}
          </span>
        </button>
      ))}
    </div>
  );
}
