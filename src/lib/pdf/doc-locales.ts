/**
 * Document output locales — the languages a generated compliance document can
 * be produced in. This is DECOUPLED from the app's UI locales (en/de/fr/it):
 * the CRA requires customer-facing documents (the EU Declaration of
 * Conformity, Annex II user information) to be in the language of the market
 * where the product is sold, which may differ from the operator's UI language.
 *
 * Scope today: EN, DE, FR, IT, PL, ES, PT, SV. Adding a language is a data
 * change — extend this list and supply its label set in
 * `market-languages.ts` (DoC + Annex II); any untranslated key falls back to
 * English per-key in the message getters.
 */

export const DOC_LOCALES = [
  "en",
  "de",
  "fr",
  "it",
  "pl",
  "es",
  "pt",
  "sv",
] as const;

export type DocLocale = (typeof DOC_LOCALES)[number];

export const DEFAULT_DOC_LOCALE: DocLocale = "en";

/** Native-language display name for the document-language picker. */
export const DOC_LOCALE_LABELS: Record<DocLocale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  pl: "Polski",
  es: "Español",
  pt: "Português",
  sv: "Svenska",
};

/** BCP-47 tag for date formatting in each document language. */
export const DOC_DATE_TAG: Record<DocLocale, string> = {
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  it: "it-IT",
  pl: "pl-PL",
  es: "es-ES",
  pt: "pt-PT",
  sv: "sv-SE",
};

export function isDocLocale(value: unknown): value is DocLocale {
  return (
    typeof value === "string" &&
    (DOC_LOCALES as readonly string[]).includes(value)
  );
}

/** Coerce an arbitrary value to a valid document locale (default: English). */
export function toDocLocale(value: unknown): DocLocale {
  return isDocLocale(value) ? value : DEFAULT_DOC_LOCALE;
}

/** Format a date in the given document locale; empty string for null input. */
export function formatDocDate(
  iso: string | null | undefined,
  locale: DocLocale,
): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(DOC_DATE_TAG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
