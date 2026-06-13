# i18n translation

English (`messages/en/*.json`) is the source of truth. Every other locale in
`src/i18n/locales.ts` (`LOCALES`) is translated on top of it; the message loader
(`src/i18n/request.ts`) always merges English underneath, so a locale with
incomplete translations renders English for the missing keys instead of
breaking.

## Fill the catalogs (machine translation)

```bash
MISTRAL_API_KEY=… node scripts/i18n/translate.mjs            # all locales, missing keys only
MISTRAL_API_KEY=… node scripts/i18n/translate.mjs --ns=settings,dashboard
MISTRAL_API_KEY=… node scripts/i18n/translate.mjs --force    # retranslate everything
MISTRAL_API_KEY=… node scripts/i18n/translate.mjs --dry-run  # preview only
```

It preserves the exact key structure, ICU placeholders/argument names, markup
tags, and a do-not-translate glossary (Seentrix, CRA, SBOM, ENISA, …). It is
idempotent: by default only keys missing from a target locale are translated,
so reviewed strings and prior runs are preserved.

After running, verify structural fidelity:

```bash
npx vitest run src/i18n/completeness.test.ts
```

The completeness test fails if any translated file drops/adds a key or breaks a
placeholder — treat machine output as a draft and have native speakers review
the regulatory-sensitive namespaces (e.g. `conformity`, `glossary`).

## Not covered

Academy lessons (`src/content/academy/*.tsx`) have JSX/ReactNode bodies, not
JSON strings — they need a separate JSX-aware translation pass.
