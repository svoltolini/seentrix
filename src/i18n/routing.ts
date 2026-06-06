import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./locales";

/**
 * Multi-locale routing (English, German, French, Italian).
 *
 * `localePrefix: "never"` means URLs never carry a `/de/` segment — the
 * active locale is resolved per-request from the `NEXT_LOCALE` cookie (set
 * from the user's saved `preferred_locale`, falling back to Accept-Language,
 * then `en`). This keeps every existing link stable while still letting the
 * whole app render in any of the four languages.
 *
 * `localeDetection: false` — we do our own negotiation (profile → cookie →
 * Accept-Language) rather than letting next-intl auto-redirect on the header.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
  localeDetection: false,
});
