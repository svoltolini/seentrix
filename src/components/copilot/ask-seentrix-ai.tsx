"use client";

import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * AskSeentrixAI — a small, reusable prompt chip dropped into empty
 * states around the app.
 *
 * Clicking the chip opens the AI drawer with a pre-populated question
 * (`seed`) so a confused user goes from "I don't know what to do on
 * this screen" to "here's an explanation + a deep-link" in one click.
 * The actual drawer remounts state is owned by CopilotProvider; all we
 * do here is call `open(seed)`.
 *
 * Two visual variants:
 *   - `chip`   — inline pill (default). Good for sitting inside an
 *                empty-state card or under a form.
 *   - `banner` — wider card with eyebrow + title + sub-label. Good for
 *                the top of a section when you want to nudge usage.
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
          "group flex w-full items-start gap-3 rounded-md bg-muted p-4 text-left ring-1 ring-white/[0.06] transition hover:bg-muted hover:ring-[#066DE6]/25",
          className,
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#066DE6]/15 ring-1 ring-[#066DE6]/25 transition group-hover:bg-[#066DE6]/25">
          <Icon
            name="ai-magic-stroke-rounded"
            size={16}
            className="text-[#066DE6]"
          />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-l6-plus uppercase tracking-wider text-[#066DE6]">
            Ask Seentrix AI
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
        <Icon
          name="arrow-right-01-stroke-rounded"
          size={14}
          className="ml-auto mt-1 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open(seed)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground/85 ring-1 ring-white/[0.06] transition hover:bg-muted hover:text-foreground hover:ring-[#066DE6]/25",
        className,
      )}
    >
      <Icon
        name="ai-magic-stroke-rounded"
        size={12}
        className="text-[#066DE6] transition group-hover:rotate-12"
      />
      {label}
    </button>
  );
}
