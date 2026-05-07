"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCopilot } from "./copilot-context";

/**
 * Topbar trigger for the Copilot drawer.
 *
 * Uses the shared `<Button variant="default" size="sm">` styling —
 * same shape, radius, and press-scale behaviour as the "Dashboard"
 * CTA on the landing-page header, so the primary actions across the
 * site feel visually consistent.
 *
 * Instead of a hover-lift on the button itself (which felt jumpy),
 * the AI-magic icon inside gets a subtle rotate-and-scale animation
 * on hover to signal that something AI-flavoured lives behind it.
 * ⌘K still works globally via CopilotProvider.
 */
export function CopilotTriggerButton({ className }: { className?: string }) {
  const t = useTranslations("copilot");
  const { toggle } = useCopilot();

  return (
    <Button
      variant="default"
      size="sm"
      onClick={toggle}
      aria-label={t("triggerAria")}
      className={cn("group/copilot hidden lg:inline-flex", className)}
    >
      <Icon
        name="ai-magic-stroke-rounded"
        size={14}
        className="transition-transform duration-300 ease-out group-hover/copilot:rotate-12 group-hover/copilot:scale-110"
      />
      {t("triggerLabel")}
    </Button>
  );
}
