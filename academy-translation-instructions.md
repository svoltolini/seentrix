# Academy lesson translation — FR + IT

You are adding French (`fr`) and Italian (`it`) content to Seentrix Academy
lesson files. Each lesson file is a `.tsx` that default-exports a `Lesson`
object with an `i18n` map already containing `en` and `de` blocks.

## What to do, per lesson file

1. Read the file. Find the `i18n: {` object. It contains an `en: { ... }`
   block and a `de: { ... }` block, each of type `LessonLocale`:
   ```ts
   { title: string; summary: string; sections: { heading: string; body: <JSX> }[]; quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[] }
   ```
2. Add a `fr: { ... }` block and an `it: { ... }` block AFTER the `de` block,
   inside the same `i18n` object. Mirror the EXACT structure of the `de` block.
3. Translate from the `en` block (source of truth) into French and Italian.
   The `de` block is your structural template — copy its shape (same sections in
   the same order, same number of quiz questions, same `correctIndex` values).

## CRITICAL rules

- **Preserve all JSX exactly.** Section `body` values are JSX (`<p>…</p>`,
  `<ul><li>…</li></ul>`, `<strong>…</strong>`, `<Link>`, `{" "}` spacing
  expressions, components, className props). Translate ONLY the human-readable
  TEXT between/inside tags. Do NOT change tag names, attributes, props,
  className values, component names, or JSX expression containers.
- **`correctIndex` stays identical** to the `en`/`de` block for each question
  (the correct answer is the same option position — just translate the option
  text in place so the same index remains correct).
- **Keep brand/technical tokens untranslated:** Seentrix, SBOM, CycloneDX,
  SPDX, CE, CVSS, EPSS, CVE, PSIRT, ENISA, CSIRT, API, CRA. Keep CRA article/
  annex numbers and Regulation numbers (e.g. "Regulation (EU) 2024/2847")
  as-is, localizing only the word "Regulation"/"Article"/"Annex" per glossary.
- **Use the glossary** at /home/user/workspace/seentrix/i18n-glossary.md for all
  CRA terms (FR and IT columns). Formal register (vous / Lei).
- Output must be valid TSX that compiles. Match the file's existing quote and
  indentation style.

## After editing each file

Verify it still parses by running from /home/user/workspace/seentrix:
`npx tsc --noEmit 2>&1 | grep "<filename>" | head` — there should be NO errors
referencing your file. Also confirm the file now contains `fr: {` and `it: {`
blocks: `grep -c "fr: {\|it: {" src/content/academy/<file>`.

Report which files you completed and that each has fr + it blocks and typechecks.
