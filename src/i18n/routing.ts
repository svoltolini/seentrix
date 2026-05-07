import { defineRouting } from "next-intl/routing";

/**
 * Single-locale routing.
 *
 * Seentrix ships in English only. We keep next-intl wired up because every
 * `t("...")` call in the codebase still uses it as a string-key registry —
 * but the locale list is fixed to `["en"]` and `localePrefix: "never"`
 * means URLs never carry a `/en/` segment.
 */
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
});
