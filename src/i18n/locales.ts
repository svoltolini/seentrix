/**
 * Supported UI locales for Seentrix.
 *
 * Single source of truth shared by the routing config, the message loader,
 * the language picker, and the locale-negotiation logic. Keep this in sync
 * with the `preferred_locale` CHECK constraint (see migration 00059).
 *
 * English is the source of truth; every other locale is translated on top of
 * it. The message loader (`src/i18n/request.ts`) always merges the full
 * English dictionary underneath the active locale, so a locale whose
 * translations are still incomplete renders English for the missing keys
 * rather than breaking — which is what lets us add a locale here and fill its
 * translations afterwards (machine-translated via `scripts/i18n/translate.mjs`).
 */

export const LOCALES = ["en", "de", "fr", "it", "pl", "es", "pt", "sv"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Native-language display name for each locale, for the picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  pl: "Polski",
  es: "Español",
  pt: "Português",
  sv: "Svenska",
};

/** Short uppercase code for compact UI (e.g. the top-bar menu). */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  fr: "FR",
  it: "IT",
  pl: "PL",
  es: "ES",
  pt: "PT",
  sv: "SV",
};

/** Cookie next-intl reads to resolve the active locale (its default name). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Best-effort locale from a raw `Accept-Language` header. Picks the first
 * supported locale by quality order; falls back to the default. Only the
 * primary subtag is considered (e.g. `de-CH` → `de`).
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const parts = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.split("-")[0]?.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    if (isLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}
