"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * Floating Copilot FAB (design handoff §11): a dark ink pill pinned to the
 * bottom-right with a green spark circle and the "Ask Seentrix AI" label.
 * Rendered globally by CopilotProvider and hidden while the drawer is open
 * (the drawer has its own close affordance). ⌘K still toggles globally.
 */
export function CopilotTriggerButton({ className }: { className?: string }) {
  const t = useTranslations("copilot");
  const { isOpen, open } = useCopilot();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label={t("triggerAria")}
      className={cn(
        "group/copilot fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-dark-cta py-2 pl-2 pr-5",
        "text-[13.5px] font-semibold text-dark-cta-foreground",
        "shadow-[0_8px_28px_rgba(40,30,20,0.28)] transition-transform duration-150 hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon
          name="ai-magic-stroke-rounded"
          size={15}
          className="transition-transform duration-300 ease-out group-hover/copilot:rotate-12 group-hover/copilot:scale-110"
        />
      </span>
      {t("triggerLabel")}
    </button>
  );
}
