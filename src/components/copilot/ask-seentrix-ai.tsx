"use client";

import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * AskSeentrixAI — a reusable button that opens the AI drawer with a
 * pre-populated question (`seed`), used in empty states and onboarding nudges.
 *
 * Both variants render a slow-drifting "smoke" gradient behind the content
 * (two blurred brand-coloured blobs on independent loops) so the AI affordance
 * feels alive and premium. The animation is purely decorative (`aria-hidden`)
 * and disables under `prefers-reduced-motion`.
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

/** Decorative drifting-gradient backdrop shared by both variants. */
function SmokeBackdrop() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span className="absolute -left-1/4 top-[-60%] size-[160%] animate-ai-smoke-a rounded-full bg-[radial-gradient(circle_at_center,rgba(6,109,230,0.55),transparent_60%)] blur-2xl" />
      <span className="absolute -right-1/4 bottom-[-60%] size-[150%] animate-ai-smoke-b rounded-full bg-[radial-gradient(circle_at_center,rgba(255,109,0,0.40),transparent_60%)] blur-2xl" />
    </span>
  );
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
          "group relative flex w-full items-center gap-4 overflow-hidden rounded-md border border-primary/20 bg-card p-4 text-left shadow-card-sm transition hover:border-primary/40 hover:shadow-card-md",
          className,
        )}
      >
        <SmokeBackdrop />
        {/* Icon badge */}
        <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-inset ring-primary/25 transition group-hover:bg-primary/25">
          <Icon name="ai-magic-stroke-rounded" size={20} />
        </span>
        {/* Copy */}
        <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-l6-plus uppercase tracking-wider text-primary">
            Ask Seentrix AI
          </span>
          <span className="text-h6 text-foreground">{label}</span>
          {sublabel && (
            <span className="text-p3 text-muted-foreground">{sublabel}</span>
          )}
        </span>
        {/* Affordance arrow */}
        <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition group-hover:translate-x-0.5">
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
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-sm border border-primary/20 bg-card px-3 py-1.5 text-l6 text-foreground shadow-card-sm transition hover:border-primary/40",
        className,
      )}
    >
      <SmokeBackdrop />
      <Icon
        name="ai-magic-stroke-rounded"
        size={14}
        className="relative z-10 text-primary transition group-hover:rotate-12"
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
