import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * Per-request message loader with English fallback.
 *
 * Seentrix renders in English, German, French, or Italian. English is the
 * source of truth and is ALWAYS loaded as the base dictionary; the active
 * locale's messages are then deep-merged on top. So:
 *   - any key not yet translated in de/fr/it transparently falls back to the
 *     English string (no missing-key crashes during a phased rollout), and
 *   - existing `useTranslations()` / `getTranslations()` callers keep working
 *     unchanged because every key still resolves.
 *
 * `requestLocale` comes from next-intl's middleware, which reads the
 * `NEXT_LOCALE` cookie (set from the user's saved `preferred_locale`). If it's
 * missing or unsupported we fall back to English.
 *
 * The 25 namespaces are merged into one flat dictionary, matching the original
 * single-locale setup so no caller needs a namespace prefix.
 */

const NAMESPACES = [
  "common",
  "dashboard",
  "auth",
  "assessment",
  "checklist",
  "products",
  "sbom",
  "vulnerabilities",
  "incidents",
  "releases",
  "conformity",
  "reports",
  "public-security",
  "entity",
  "documents",
  "pricing",
  "billing",
  "upgrade",
  "landing",
  "blog",
  "settings",
  "glossary",
  "copilot",
  "contact",
  "diagrams",
  "risk-assessment",
  "technical-file",
] as const;

type Messages = Record<string, unknown>;

/**
 * Deep-merge `override` onto `base`. Plain objects are merged recursively;
 * everything else (strings, arrays, numbers) is overwritten by `override`
 * when present. Used to layer a locale's partial translations over the full
 * English base.
 */
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (
      isPlainObject(existing) &&
      isPlainObject(value)
    ) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function isPlainObject(value: unknown): value is Messages {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function loadNamespace(
  locale: Locale,
  namespace: string,
): Promise<Messages> {
  try {
    return (await import(`../../messages/${locale}/${namespace}.json`)).default;
  } catch {
    // Locale folder or namespace file not present yet (phased rollout) —
    // caller still has the English base merged underneath.
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(routing.locales, requested)
    ? (requested as Locale)
    : DEFAULT_LOCALE;

  // Always load the full English base.
  const enParts = await Promise.all(
    NAMESPACES.map((ns) => loadNamespace(DEFAULT_LOCALE, ns)),
  );
  let messages: Messages = {};
  for (const part of enParts) messages = { ...messages, ...part };

  // Layer the active locale's translations on top (deep-merged), if any.
  if (locale !== DEFAULT_LOCALE) {
    const localeParts = await Promise.all(
      NAMESPACES.map((ns) => loadNamespace(locale, ns)),
    );
    let localeMessages: Messages = {};
    for (const part of localeParts) {
      localeMessages = { ...localeMessages, ...part };
    }
    messages = deepMerge(messages, localeMessages);
  }

  return { locale, messages };
});
