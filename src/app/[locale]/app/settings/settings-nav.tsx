"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "nav.organization", segment: "/organization" },
  { key: "nav.entity", segment: "/entity" },
  { key: "nav.team", segment: "/team" },
  { key: "nav.billing", segment: "/billing" },
  { key: "nav.activity", segment: "/activity" },
  { key: "nav.account", segment: "/account" },
  { key: "nav.security", segment: "/security" },
] as const;

const basePath = "/app/settings";

/**
 * SettingsNav — Nask underlined tab strip. Active tab gets a primary-blue
 * underline + primary text; inactive tabs are muted-foreground.
 */
export function SettingsNav() {
  const t = useTranslations("settings");
  const pathname = usePathname();

  function isActive(segment: string) {
    return pathname.startsWith(basePath + segment);
  }

  return (
    <div className="-mx-1 flex w-full items-center gap-6 overflow-x-auto border-b border-border px-1">
      {TABS.map((tab) => {
        const active = isActive(tab.segment);
        return (
          <Link
            key={tab.key}
            href={`${basePath}${tab.segment}`}
            className={cn(
              "relative flex h-11 shrink-0 items-center text-l6 transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab.key)}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
