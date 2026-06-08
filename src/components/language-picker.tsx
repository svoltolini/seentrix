"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { setPreferredLocale } from "@/app/[locale]/app/settings/locale-actions";

/**
 * LanguagePicker — lets the user switch the whole app between English, German,
 * French, and Italian. Persists via `setPreferredLocale` (writes the user row
 * + NEXT_LOCALE cookie) then refreshes so the new language renders everywhere.
 *
 * `variant="menu"` renders a compact trigger for the top-bar user menu;
 * `variant="full"` renders a labelled control for the Settings page.
 */
export function LanguagePicker({
  variant = "full",
  align = "end",
}: {
  variant?: "menu" | "full";
  align?: "start" | "end";
}) {
  const t = useTranslations("settings.language");
  const active = useLocale();
  const [pending, startTransition] = useTransition();

  const current: Locale = isLocale(active) ? active : "en";

  function choose(locale: Locale) {
    if (locale === current) return;
    // Persist server-side (writes the user row + the NEXT_LOCALE cookie), then
    // do a FULL reload. With `localePrefix: "never"`, next-intl resolves the
    // language purely from that cookie; a full top-level reload re-issues the
    // request with the freshly-set cookie and re-renders every RSC (layouts,
    // metadata, server components) in the new language. A soft
    // `router.refresh()` raced the action's Set-Cookie and left the page on
    // the old locale — hence the hard reload (language changes are rare).
    startTransition(async () => {
      await setPreferredLocale(locale);
      window.location.assign(window.location.href);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 outline-none transition-colors disabled:opacity-60",
              variant === "full"
                ? "h-11 rounded-md border-[1.5px] border-border-outline bg-card px-3.5 text-p3 text-foreground hover:bg-muted"
                : "rounded-md px-2 py-1.5 text-p3 text-foreground hover:bg-muted",
            )}
            aria-label={t.has("label") ? t("label") : "Language"}
          />
        }
      >
        <Icon
          name="Global"
          size={variant === "full" ? 18 : 16}
          variant="Bold"
          className="text-muted-foreground"
        />
        <span>
          {variant === "full" ? LOCALE_LABELS[current] : LOCALE_SHORT[current]}
        </span>
        <Icon name="ArrowDown2" size={14} className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[180px]">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => choose(locale)}
            className={cn(current === locale && "bg-muted text-foreground")}
          >
            <span className="w-7 text-p4-r text-muted-foreground">
              {LOCALE_SHORT[locale]}
            </span>
            {LOCALE_LABELS[locale]}
            {current === locale && (
              <Icon
                name="TickCircle"
                size={16}
                variant="Bold"
                className="ml-auto text-primary"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
