"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * TeamChatStrip — the dashboard Team card: just the members' avatars,
 * drifting slowly around a fixed-height pool (per user request — "pictures
 * moving around the card like a pool effect"). Every avatar follows the
 * shared `sx-float` path (globals.css) with its own size, duration, delay
 * and direction so the motion never reads as synchronized. Names surface
 * as native tooltips; `prefers-reduced-motion` freezes the layout.
 */

export interface TeamChatItem {
  id: string;
  name: string;
  avatarUrl: string | null;
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase();
}

// Hand-placed spots: spread across the pool, sized for a little depth,
// negative delays so everyone starts mid-drift instead of in lockstep.
const SPOTS = [
  { left: "12%", top: "16%", size: 52, duration: 10,   delay: 0 },
  { left: "52%", top: "8%",  size: 42, duration: 12,   delay: -4 },
  { left: "76%", top: "34%", size: 56, duration: 11,   delay: -7 },
  { left: "30%", top: "46%", size: 46, duration: 13,   delay: -2 },
  { left: "58%", top: "60%", size: 40, duration: 9.5,  delay: -9 },
  { left: "8%",  top: "62%", size: 44, duration: 11.5, delay: -5 },
] as const;

interface Props {
  members: TeamChatItem[];
}

export function TeamChatStrip({ members }: Props) {
  if (members.length === 0) return null;

  return (
    <div className="relative h-[190px] w-full overflow-hidden">
      {members.slice(0, SPOTS.length).map((m, i) => {
        const spot = SPOTS[i];
        return (
          <div
            key={m.id}
            title={m.name}
            className="sx-pool-float absolute"
            style={{
              left: spot.left,
              top: spot.top,
              width: spot.size,
              height: spot.size,
              animationDuration: `${spot.duration}s`,
              animationDelay: `${spot.delay}s`,
              animationDirection: i % 2 ? "reverse" : "normal",
            }}
          >
            <Avatar className="size-full rounded-full border-2 border-card shadow-[0_4px_14px_rgba(60,40,20,0.16)]">
              <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
              <AvatarFallback className="rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                {initialsOf(m.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        );
      })}
    </div>
  );
}
