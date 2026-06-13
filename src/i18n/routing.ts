import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./locales";

/**
 * Multi-locale routing (English, German, French, Italian, Polish, Spanish,
 * Portuguese, Swedish — the full set lives in `LOCALES`).
 *
 * `localePrefix: "never"` means URLs never carry a `/de/` segment — the
 * active locale is resolved per-request from the `NEXT_LOCALE` cookie (set
 * from the user's saved `preferred_locale`, falling back to Accept-Language,
 * then `en`). This keeps every existing link stable while still letting the
 * whole app render in any of the four languages.
 *
 * `localeDetection` stays ENABLED (default). With `localePrefix: "never"`
 * there is no URL segment to read the locale from, so next-intl resolves it
 * from the `NEXT_LOCALE` cookie — which is exactly what the language picker
 * and the middleware write. Setting `localeDetection: false` would pin every
 * request to the default locale and ignore the cookie (it's documented as
 * "the locale can't be negotiated on the server"), so we must NOT set it.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
});
