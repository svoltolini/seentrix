"use client";

import { useTranslations } from "next-intl";
import { HugeIcon } from "@/components/huge-icon";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * Topbar trigger for the Copilot drawer. Rendered inside the authenticated
 * app topbar; shows the ⌘K / Ctrl+K hint on desktop.
 */
export function CopilotTriggerButton({ className }: { className?: string }) {
  const t = useTranslations("copilot");
  const { toggle } = useCopilot();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground/85 transition hover:border-white/[0.14] hover:bg-white/[0.06] lg:inline-flex",
        className,
      )}
      aria-label={t("triggerAria")}
    >
      <HugeIcon name="sparkles-stroke-rounded" size={14} className="text-[#60A5FA]" />
      {t("triggerLabel")}
      <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground lg:inline-flex">
        ⌘K
      </kbd>
    </button>
  );
}
