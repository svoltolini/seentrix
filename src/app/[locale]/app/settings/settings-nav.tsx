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
 * SettingsNav — the Clay left vertical nav (design `.sx-snav`): a sticky
 * column of left-aligned items; the active one gets an accent-soft fill with
 * accent text. On small screens it collapses to a horizontal scroll strip.
 */
export function SettingsNav() {
  const t = useTranslations("settings");
  const pathname = usePathname();

  function isActive(segment: string) {
    return pathname.startsWith(basePath + segment);
  }

  return (
    <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-[88px] lg:flex-col lg:overflow-visible">
      {TABS.map((tab) => {
        const active = isActive(tab.segment);
        return (
          <Link
            key={tab.key}
            href={`${basePath}${tab.segment}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3.5 py-2.5 text-[14px] transition-colors",
              active
                ? "bg-accent-soft font-semibold text-primary"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
