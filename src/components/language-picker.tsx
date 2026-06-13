"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  DOC_LOCALES,
  DOC_LOCALE_LABELS,
  isDocLocale,
  type DocLocale,
} from "@/lib/pdf/doc-locales";
import { DOC_LOCALE_COOKIE } from "@/lib/pdf/doc-locale-cookie";
import {
  setPreferredLocale,
  setPreferredDocLanguage,
} from "@/app/[locale]/app/settings/locale-actions";

/**
 * LanguagePicker — two language controls in one menu:
 *
 *   • Display language — switches the whole app UI (English, German, French,
 *     Italian; the languages the interface is translated into). Persists via
 *     `setPreferredLocale` + a full reload so every RSC re-renders.
 *
 *   • Document language — the language generated CRA documents (Declaration of
 *     Conformity, Annex II) come out in (eight EU market languages). Persists
 *     via `setPreferredDocLanguage`; no reload, since it doesn't change the UI.
 *     Per-document download menus can still override it for a single file.
 *
 * `variant="menu"` renders a compact trigger for the top-bar; `variant="full"`
 * a labelled control for the Settings page.
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

  // Current document language. Defaults to "en" (matches SSR); refreshed from
  // the NEXT_DOC_LOCALE cookie whenever the menu opens — done in the open
  // handler (an event) rather than an effect, so there's no hydration mismatch.
  const [docLocale, setDocLocale] = useState<DocLocale>("en");
  function syncDocLocaleFromCookie() {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${DOC_LOCALE_COOKIE}=`));
    const value = match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
    if (isDocLocale(value)) setDocLocale(value);
  }

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      try {
        window.localStorage.setItem("sx_lang", locale);
      } catch {
        // Storage unavailable (private mode etc.) — non-fatal.
      }
      await setPreferredLocale(locale);
      window.location.assign(window.location.href);
    });
  }

  function chooseDoc(locale: DocLocale) {
    if (locale === docLocale) return;
    setDocLocale(locale); // optimistic — no reload, the UI language is unchanged
    // The server action persists the user row + sets the NEXT_DOC_LOCALE
    // cookie that the on-demand PDF routes read.
    startTransition(async () => {
      await setPreferredDocLanguage(locale);
    });
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) syncDocLocaleFromCookie();
      }}
    >
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className={cn(
              "inline-flex items-center outline-none transition-colors duration-150 disabled:opacity-60",
              variant === "full"
                ? "h-11 gap-2 rounded-md border border-border-strong bg-card px-3.5 text-p3 text-foreground hover:bg-muted"
                : "h-[38px] gap-1.5 rounded-[11px] px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
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
        className="max-h-[70vh] w-[220px] overflow-y-auto rounded-md border border-border-strong bg-card p-1 shadow-[0_12px_34px_rgba(60,40,20,0.14)]"
      >
        <DropdownMenuLabel>
          {t.has("displayHeading") ? t("displayHeading") : "Display language"}
        </DropdownMenuLabel>
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

        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          {t.has("documentHeading") ? t("documentHeading") : "Document language"}
        </DropdownMenuLabel>
        {DOC_LOCALES.map((locale) => {
          const isActive = docLocale === locale;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => chooseDoc(locale)}
              className={cn(
                "rounded-[8px] focus:bg-muted data-highlighted:bg-muted",
                isActive && "font-semibold text-foreground",
              )}
            >
              <span className="w-7 text-p4-r uppercase text-muted-foreground">
                {locale.toUpperCase()}
              </span>
              {DOC_LOCALE_LABELS[locale]}
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
