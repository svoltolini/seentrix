"use client";

import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * Topbar trigger for the Copilot drawer.
 *
 * Distinct from the surrounding nav items — gets a subtle gradient tint
 * and a coloured AI-magic icon so it reads as a special affordance, not
 * just another link. No keyboard-shortcut chip (the shortcut still works
 * globally via CopilotProvider).
 */
export function CopilotTriggerButton({ className }: { className?: string }) {
  const t = useTranslations("copilot");
  const { toggle } = useCopilot();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "hidden items-center gap-2 rounded-lg bg-gradient-to-r from-[#3B82F6]/18 via-[#6366F1]/14 to-[#8B5CF6]/12 px-3.5 py-1.5 text-xs font-semibold text-foreground ring-1 ring-[#3B82F6]/25 transition hover:from-[#3B82F6]/28 hover:via-[#6366F1]/22 hover:to-[#8B5CF6]/20 hover:ring-[#3B82F6]/45 lg:inline-flex",
        className,
      )}
      aria-label={t("triggerAria")}
    >
      <HugeIcon
        name="ai-magic-stroke-rounded"
        size={14}
        className="text-[#60A5FA]"
      />
      {t("triggerLabel")}
    </button>
  );
}
