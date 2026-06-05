"use client";

import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * AskSeentrixAI — a reusable button that opens the AI drawer with a
 * pre-populated question (`seed`), used in empty states and onboarding nudges.
 *
 * Variants:
 *   - `chip`   — inline pill (default). Sits inside an empty-state card.
 *   - `banner` — wider card with eyebrow + title + sub-label. Used to nudge
 *                usage at the top/bottom of a section (e.g. the dashboard
 *                get-started screen).
 */
interface AskSeentrixAIProps {
  seed: string;
  label: string;
  sublabel?: string;
  variant?: "chip" | "banner";
  className?: string;
}

export function AskSeentrixAI({
  seed,
  label,
  sublabel,
  variant = "chip",
  className,
}: AskSeentrixAIProps) {
  const { open } = useCopilot();

  if (variant === "banner") {
    return (
      <button
        type="button"
        onClick={() => open(seed)}
        className={cn(
          "group flex w-full items-center gap-4 rounded-md border border-border-outline bg-card p-4 text-left shadow-card-sm transition hover:border-primary/40 hover:shadow-card-md",
          className,
        )}
      >
        {/* Icon badge */}
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
          <Icon name="ai-magic-stroke-rounded" size={20} />
        </span>
        {/* Copy */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-l6-plus uppercase tracking-wider text-primary">
            Ask Seentrix AI
          </span>
          <span className="text-h6 text-foreground">{label}</span>
          {sublabel && (
            <span className="text-p3 text-muted-foreground">{sublabel}</span>
          )}
        </span>
        {/* Affordance arrow */}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition group-hover:translate-x-0.5">
          <Icon name="arrow-right-01-stroke-rounded" size={16} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open(seed)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-sm border border-border-outline bg-card px-3 py-1.5 text-l6 text-foreground transition hover:border-primary/40 hover:bg-muted/40",
        className,
      )}
    >
      <Icon
        name="ai-magic-stroke-rounded"
        size={14}
        className="text-primary transition group-hover:rotate-12"
      />
      <span>{label}</span>
    </button>
  );
}
