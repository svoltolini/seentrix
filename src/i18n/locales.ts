/**
 * Supported UI locales for Seentrix.
 *
 * Single source of truth shared by the routing config, the message loader,
 * the language picker, and the locale-negotiation logic. Keep this in sync
 * with the `preferred_locale` CHECK constraint in migration 00041.
 */

export const LOCALES = ["en", "de", "fr", "it"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Native-language display name for each locale, for the picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

/** Short uppercase code for compact UI (e.g. the top-bar menu). */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  fr: "FR",
  it: "IT",
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
