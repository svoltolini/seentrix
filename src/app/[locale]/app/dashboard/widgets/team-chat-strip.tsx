"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * TeamChatStrip — 3-per-row grid in the dashboard right rail.
 *
 * Earlier passes tried 5 horizontal tiles in a single row, which
 * truncated long first names even after we shrunk the wrapper. With
 * 3 columns each tile gets ~95 px (322 px rail / 3 - gaps), more than
 * enough for a full first name + a 46 px avatar. Wraps to a second
 * row at 4-6 members; we cap at 6 to keep the rail compact.
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
    <div className="grid grid-cols-3 gap-3">
      {members.slice(0, 6).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className="group/chat-tile flex min-w-0 flex-col items-center gap-2 outline-none"
          aria-label={m.name}
        >
          <Avatar
            size="lg"
            className="size-11 shrink-0 transition-transform group-hover/chat-tile:scale-105"
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
