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

export function SettingsNav() {
  const t = useTranslations("settings");
  const pathname = usePathname();

  function isActive(segment: string) {
    return pathname.startsWith(basePath + segment);
  }

  return (
    <div className="inline-flex rounded-xl bg-card p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}${tab.segment}`}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            isActive(tab.segment)
              ? "bg-white/[0.08] text-foreground"
              : "text-muted-foreground/60 hover:text-foreground"
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </div>
  );
}
