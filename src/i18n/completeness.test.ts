import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, DEFAULT_LOCALE } from "./locales";

/**
 * Locale completeness guard.
 *
 * English is the source of truth. For every non-English locale that ships a
 * given namespace file, the set of leaf keys AND placeholder tokens must match
 * English exactly — so a translator can't silently drop a key, add a stray
 * one, or break an interpolation like `{count}` / `{name}`.
 *
 * A locale is allowed to be INCOMPLETE during the phased rollout (a namespace
 * file may simply not exist yet — the loader falls back to English). But any
 * file that DOES exist must be structurally faithful to English.
 */

const MESSAGES_DIR = join(process.cwd(), "messages");

type Json = Record<string, unknown>;

function readJson(locale: string, file: string): Json | null {
  const path = join(MESSAGES_DIR, locale, file);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Collect every leaf key path, e.g. "settings.account.nameLabel". */
function leafKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) {
    return obj.flatMap((v, i) => leafKeys(v, `${prefix}[${i}]`));
  }
  return Object.entries(obj as Json).flatMap(([k, v]) =>
    leafKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

/**
 * Extract the set of ICU argument NAMES referenced by a message string.
 *
 * We deliberately compare argument *names* (e.g. `count`, `name`, `email`),
 * NOT raw `{…}` spans. ICU messages embed translatable text inside plural/
 * select sub-messages — e.g. `{count, plural, one {# product} other {# products}}`
 * — and a correct translation localizes "product(s)" while keeping the argument
 * `count`. Comparing raw spans would wrongly flag that as a mismatch. So we
 * pull out the leading identifier of every `{name ...}` / `{name}` occurrence,
 * which is what must stay identical across locales.
 */
function placeholders(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const names = new Set<string>();
  // Match `{` followed by a JS-identifier-ish argument name. Captures both
  // simple `{name}` and complex `{name, plural, ...}` forms. The `#` plural
  // placeholder and inner sub-message text are intentionally ignored.
  const re = /\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:,|\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    names.add(m[1]);
  }
  return [...names].sort();
}

/** Map of leaf-key-path -> placeholder set, for placeholder fidelity checks. */
function placeholderMap(obj: unknown, prefix = ""): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  function walk(o: unknown, p: string) {
    if (o === null || typeof o !== "object") {
      const ph = placeholders(o);
      if (ph.length) out[p] = ph;
      return;
    }
    if (Array.isArray(o)) {
      o.forEach((v, i) => walk(v, `${p}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(o as Json)) {
      walk(v, p ? `${p}.${k}` : k);
    }
  }
  walk(obj, prefix);
  return out;
}

const enFiles = readdirSync(join(MESSAGES_DIR, DEFAULT_LOCALE)).filter((f) =>
  f.endsWith(".json"),
);

const otherLocales = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

describe("i18n message completeness", () => {
  for (const locale of otherLocales) {
    describe(`locale: ${locale}`, () => {
      for (const file of enFiles) {
        it(`${file}: matches English key set + placeholders (when present)`, () => {
          const en = readJson(DEFAULT_LOCALE, file);
          const loc = readJson(locale, file);
          // Not yet translated — allowed (English fallback covers it).
          if (loc === null) return;

          const enKeys = new Set(leafKeys(en));
          const locKeys = new Set(leafKeys(loc));

          const missing = [...enKeys].filter((k) => !locKeys.has(k));
          const extra = [...locKeys].filter((k) => !enKeys.has(k));
          expect(missing, `${locale}/${file} missing keys`).toEqual([]);
          expect(extra, `${locale}/${file} unexpected keys`).toEqual([]);

          // Placeholder fidelity per key.
          const enPh = placeholderMap(en);
          const locPh = placeholderMap(loc);
          for (const [key, tokens] of Object.entries(enPh)) {
            expect(
              locPh[key] ?? [],
              `${locale}/${file} key "${key}" placeholder mismatch`,
            ).toEqual(tokens);
          }
        });
      }
    });
  }
});
