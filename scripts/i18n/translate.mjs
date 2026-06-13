#!/usr/bin/env node
/**
 * Machine-translate the UI message catalogs.
 *
 * English (`messages/en/*.json`) is the source of truth. This fills the other
 * locales by translating each namespace with the project's Mistral model
 * (the same provider the Copilot uses), preserving:
 *   - the exact key structure (the i18n completeness test enforces this),
 *   - ICU placeholders / argument names (`{count}`, `{name, plural, ...}`),
 *   - the do-not-translate glossary below (brand + CRA/security terms).
 *
 * Idempotent by default: only keys MISSING from a target locale are
 * translated, so reviewed/hand-tuned strings (and prior runs) are preserved.
 * Pass --force to retranslate everything.
 *
 * Usage:
 *   MISTRAL_API_KEY=… node scripts/i18n/translate.mjs
 *   …translate.mjs --locales=pl,es --ns=settings,dashboard
 *   …translate.mjs --force
 *
 * Flags:
 *   --locales=a,b   target locales (default: every locale except en)
 *   --ns=a,b        namespaces to do (default: every messages/en/*.json)
 *   --force         retranslate all keys, not just missing ones
 *   --dry-run       print what would change; write nothing
 *
 * NOTE: the Academy lessons (src/content/academy/*.tsx) are NOT covered — their
 * bodies are JSX/ReactNode, not JSON strings, and need a JSX-aware pass.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MESSAGES = join(ROOT, "messages");
const SOURCE = "en";
const MODEL = "mistral-large-latest";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

// Native-language names so the model knows the target precisely.
const LOCALE_NAMES = {
  de: "German", fr: "French", it: "Italian",
  pl: "Polish", es: "Spanish (Spain)", pt: "Portuguese (Portugal)", sv: "Swedish",
};

// Terms that MUST survive verbatim in every language.
const GLOSSARY = [
  "Seentrix", "CRA", "Cyber Resilience Act", "SBOM", "CycloneDX", "SPDX",
  "CSAF", "VEX", "CE", "CVSS", "EPSS", "CVE", "PSIRT", "ENISA", "CSIRT",
  "API", "Copilot", "Annex", "Article",
];

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    }),
  );
  const allLocales = readdirSync(MESSAGES).filter(
    (d) => d !== SOURCE && existsSync(join(MESSAGES, d)),
  );
  return {
    locales: args.locales ? String(args.locales).split(",") : allLocales,
    namespaces: args.ns
      ? String(args.ns).split(",")
      : readdirSync(join(MESSAGES, SOURCE))
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/\.json$/, "")),
    force: Boolean(args.force),
    dryRun: Boolean(args["dry-run"]),
  };
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Keys present in `base` but absent (or, with force, all) in `target`. */
function pickMissing(base, target, force) {
  if (!isObj(base)) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(base)) {
    const t = isObj(target) ? target[k] : undefined;
    if (isObj(v)) {
      const sub = pickMissing(v, t, force);
      if (sub && Object.keys(sub).length) out[k] = sub;
    } else if (force || t === undefined) {
      out[k] = v;
    }
  }
  return out;
}

function deepMerge(base, override) {
  const out = isObj(base) ? { ...base } : {};
  for (const [k, v] of Object.entries(override ?? {})) {
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

function countLeaves(o) {
  if (!isObj(o)) return o === undefined ? 0 : 1;
  return Object.values(o).reduce((n, v) => n + countLeaves(v), 0);
}

async function translateChunk(localeName, json) {
  const system = [
    `You are a professional software localizer translating UI strings into ${localeName}.`,
    "Translate every STRING VALUE in the JSON. Output ONLY a JSON object with the EXACT same keys and nesting — never add, drop, or rename a key.",
    "Preserve every ICU placeholder exactly: `{name}`, `{count}`, and plural/select forms like `{count, plural, one {# item} other {# items}}` — translate only the human-readable sub-text, keep argument names and `#` intact.",
    "Preserve markup tags (e.g. `<b>…</b>`, `<link>…</link>`) and any leading/trailing whitespace or ellipsis (…).",
    `Keep these terms UNTRANSLATED verbatim: ${GLOSSARY.join(", ")}.`,
    "Use natural, concise product-UI phrasing appropriate to the language. Do not add explanations.",
  ].join("\n");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(json) },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Mistral ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  if (!process.env.MISTRAL_API_KEY) {
    console.error("MISTRAL_API_KEY is not set — cannot translate.");
    process.exit(1);
  }
  const { locales, namespaces, force, dryRun } = parseArgs();
  console.log(
    `Translating [${namespaces.join(", ")}] → [${locales.join(", ")}]` +
      `${force ? " (force)" : " (missing only)"}${dryRun ? " (dry-run)" : ""}\n`,
  );

  for (const locale of locales) {
    const localeName = LOCALE_NAMES[locale] ?? locale;
    for (const ns of namespaces) {
      const enPath = join(MESSAGES, SOURCE, `${ns}.json`);
      if (!existsSync(enPath)) continue;
      const en = JSON.parse(readFileSync(enPath, "utf8"));
      const outPath = join(MESSAGES, locale, `${ns}.json`);
      const existing = existsSync(outPath)
        ? JSON.parse(readFileSync(outPath, "utf8"))
        : {};

      const todo = pickMissing(en, existing, force);
      const n = countLeaves(todo);
      if (n === 0) {
        console.log(`  ${locale}/${ns}: up to date`);
        continue;
      }
      console.log(`  ${locale}/${ns}: translating ${n} string(s)…`);
      if (dryRun) continue;

      const translated = await translateChunk(localeName, todo);
      const merged = deepMerge(existing, translated);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n");
    }
  }
  console.log("\nDone. Run `npx vitest run src/i18n/completeness.test.ts` to verify.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
