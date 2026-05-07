"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * TeamChatStrip — 1:1 from Figma frame `28:1755`
 * (`data-name="Frame 162506"`, id `142:15825`).
 *
 * Layout: 5 horizontal contact tiles, each 46×70 (avatar 46×46 + name label
 * 14/500 underneath). Separated by 20px gaps.
 *
 * In Seentrix this surfaces org members the user can ping with the Copilot
 * "Ask about this" affordance (or simply highlights teammates collaborating
 * on the same product).
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
    <div className="flex items-start gap-5">
      {members.slice(0, 5).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={m.onClick}
          className="group/chat-tile flex w-[46px] flex-col items-center gap-2 outline-none"
          aria-label={m.name}
        >
          <Avatar
            size="lg"
            className="size-[46px] transition-transform group-hover/chat-tile:scale-105"
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
