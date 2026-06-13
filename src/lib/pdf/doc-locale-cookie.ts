import { isDocLocale, type DocLocale } from "./doc-locales";

/**
 * Cookie carrying the user's default document-output language, mirrored from
 * `users.preferred_doc_language` so the on-demand PDF routes can resolve it
 * from the request without a DB round-trip. Separate from NEXT_LOCALE (the UI
 * language).
 */
export const DOC_LOCALE_COOKIE = "NEXT_DOC_LOCALE";

/** Read a valid document locale from a raw Cookie header, or null. */
export function docLocaleFromCookieHeader(
  header: string | null,
): DocLocale | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === DOC_LOCALE_COOKIE) {
      const value = decodeURIComponent(rest.join("="));
      if (isDocLocale(value)) return value;
    }
  }
  return null;
}
