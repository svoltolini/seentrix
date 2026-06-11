"use client";

import { cn } from "@/lib/utils";

/**
 * Segmented — the Clay inline pill-track view switcher (design `.sx-seg`).
 *
 * A recessed warm-grey trough (3px padding, 9px radius, 2px gaps) holding
 * 2–3 mutually-exclusive options. Exactly one is active: a white chip that
 * looks raised (white fill + warm 0 1px 2px shadow + ink text). Inactive
 * options are flat muted text; hover only darkens the text to ink — never a
 * background, so hover can't be confused with active.
 *
 * Tertiary control — compact (6px 13px, 12.5px/600), meant to sit quietly in
 * a card header.
 */
export function Segmented({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-0.5 rounded-[9px] bg-muted p-[3px]",
        className,
      )}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "whitespace-nowrap rounded-[7px] px-[13px] py-1.5 text-[12.5px] font-semibold transition-all duration-150",
              on
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(80,60,40,0.08)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
