"use client";

import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * Topbar trigger for the Copilot drawer.
 *
 * Styled to match the white CTA pill used by the dashboard's AlertBanner
 * so the affordance reads as "primary action" rather than "another nav
 * link". No keyboard-shortcut chip — ⌘K still works globally.
 */
export function CopilotTriggerButton({ className }: { className?: string }) {
  const t = useTranslations("copilot");
  const { toggle } = useCopilot();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "hidden shrink-0 items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black shadow-sm transition-transform hover:-translate-y-0.5 lg:inline-flex",
        className,
      )}
      aria-label={t("triggerAria")}
    >
      <HugeIcon
        name="ai-magic-stroke-rounded"
        size={14}
        className="text-[#3B82F6]"
      />
      {t("triggerLabel")}
    </button>
  );
}
