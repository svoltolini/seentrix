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
      // Mirror to localStorage per the design spec (sx_lang) — the cookie +
      // profile row remain the source of truth for the actual negotiation.
      try {
        window.localStorage.setItem("sx_lang", locale);
      } catch {
        // Storage unavailable (private mode etc.) — non-fatal.
      }
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
              "inline-flex items-center outline-none transition-colors duration-150 disabled:opacity-60",
              variant === "full"
                ? "h-11 gap-2 rounded-md border border-border-strong bg-card px-3.5 text-p3 text-foreground hover:bg-muted"
                : // Nav icon-button recipe: 38px tall, 11px radius, grey →
                  // ink on hover with the warm hover fill.
                  "h-[38px] gap-1.5 rounded-[11px] px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label={t.has("label") ? t("label") : "Language"}
          />
        }
      >
        <Icon
          name="Global"
          size={variant === "full" ? 18 : 17}
          className="text-current"
        />
        <span className="uppercase">
          {variant === "full" ? LOCALE_LABELS[current] : LOCALE_SHORT[current]}
        </span>
        <Icon name="ArrowDown2" size={13} className="text-current" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-[180px] rounded-md border border-border-strong bg-card p-1 shadow-[0_12px_34px_rgba(60,40,20,0.14)]"
      >
        {LOCALES.map((locale) => {
          const isActive = current === locale;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => choose(locale)}
              className={cn(
                "rounded-[8px] focus:bg-muted data-highlighted:bg-muted",
                isActive && "font-semibold text-foreground",
              )}
            >
              <span className="w-7 text-p4-r uppercase text-muted-foreground">
                {LOCALE_SHORT[locale]}
              </span>
              {LOCALE_LABELS[locale]}
              {isActive && (
                <Icon
                  name="check"
                  size={15}
                  variant="Bold"
                  className="ml-auto text-primary"
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
