# Seentrix — 4-Language System (EN · DE · FR · IT)

Implementation plan for review. No code is written until you approve.

---

## 1. Goal

Make the entire Seentrix platform available in **English, German, French, and Italian** — UI, Academy (lessons + quizzes + audio), the AI Copilot, and the generated CRA compliance documents — with a clear way for each user to pick their language.

## 2. The CRA legal question (researched, settled)

The CRA does **not** require English-only. For customer-facing compliance outputs the regulation effectively requires the **local market language**:

| Output | Required language | Source |
|---|---|---|
| Information & instructions to the user (Annex II) | "A language easily understood by users and market-surveillance authorities" → in practice the official language of the Member State where the product is sold | CRA Art. 13 / Annex II |
| EU Declaration of Conformity | The language(s) required by the EU country where the product is sold | Your Europe / EC; CRA Annex V |
| Technical documentation / notified-body correspondence | An official language of the notified body's Member State, or one acceptable to it | CRA Art. 23 / Annex VII |

**Conclusion:** translating the **generated documents** (DoC, user instructions) into DE/FR/IT is a genuine compliance feature for Swiss/EU SME manufacturers selling into those markets — not just UI polish. So documents are in scope, not only the interface.

## 3. Current state (good news — it's built for this)

- **`next-intl` 4.9.1** is wired through the whole app; every label already uses `t("…")`. Locale routing exists but is locked to `["en"]` with `localePrefix: "never"`.
- **UI strings:** ~2,517 keys across 25 namespaces in `messages/en/*.json`.
- **Academy:** lesson type already has `i18n: Record<LocaleId, LessonLocale>` with `LocaleId = "en" | "de"`. `cra-101` already ships German content; `getLessonContent()` falls back to `en` for missing locales. 11 lessons, ~110 quiz questions, 11 audio briefings (`/public/academy/<id>-briefing.mp3`).
- **Copilot:** Mistral chat; system prompt hardcodes "Always respond in English"; RAG `kb_chunks` table already has a `language` column (currently `'en'`).
- **Documents:** 8 PDF templates incl. `declaration-of-conformity`, `end-user-info`, `technical-documentation`, `incident-report`, etc.

## 4. Language model & selection UX

- **Locales:** `en` (default), `de`, `fr`, `it`. `localePrefix` stays `"never"` (no `/de/` URL segments — keeps existing links stable). Locale resolved from the user's saved preference, falling back to browser `Accept-Language`, then `en`.
- **Persistence:** add `preferred_locale` to the user profile (Supabase `profiles` table) + a cookie for instant SSR. New migration + RLS-safe update.
- **Picker:** a language selector in **Settings → Preferences** and a quick switch in the top-bar user menu. Switching updates the profile, sets the cookie, and refreshes.
- **Documents** get their own language choice at generation time (defaults to the user's UI locale but can be overridden, since a doc's language follows the *target market*, not the user's UI).

## 5. Translation approach

I produce and refine all DE/FR/IT content myself, driven by a **CRA terminology glossary** (canonical translations for "Declaration of Conformity", "essential requirements", "support period", "notified body", "vulnerability handling", etc.) so terms stay consistent and legally correct across UI, Academy, Copilot, and documents. English remains the source of truth; the glossary prevents drift.

## 6. Phased delivery (each phase ships to staging on its own)

### Phase A — Locale infrastructure + language picker
- Unlock `routing.ts` to 4 locales; locale negotiation (profile → cookie → `Accept-Language` → `en`).
- `profiles.preferred_locale` migration + server action to update it.
- Language picker in Settings + user menu.
- DE/FR/IT initially fall back to English where strings aren't translated yet.
- **Deliverable:** working switcher on staging; app fully usable, English everywhere until Phase B fills strings.

### Phase B — UI translation (DE/FR/IT)
- Translate all 25 namespaces (~2,517 keys) into `messages/de|fr|it/*.json`, glossary-driven.
- Verify no missing-key fallbacks; spot-check dense screens (dashboard, pricing, settings, conformity).
- **Deliverable:** entire interface in 4 languages.

### Phase C — Copilot multilingual
- Pass the user's locale into `buildSystemPrompt`; replace "Always respond in English" with "respond in the user's language (<locale>)".
- RAG: keep English `kb_chunks` (Mistral translates at answer time) — confirmed strong for DE/FR/IT — and pass `language` for filtering once localized chunks exist.
- Seeded questions (e.g. the deadline "Explain" button) localized.
- **Deliverable:** Copilot answers in the user's chosen language.

### Phase D — Academy text + quizzes
- Fill `i18n` for `fr` + `it` (and complete `de`) across 11 lessons + ~110 quiz questions. Extend `LocaleId` to all four.
- **Deliverable:** Academy readable + quizzable in 4 languages.

### Phase E — Academy audio (TTS regeneration)
- Generate DE/FR/IT narration for all 11 briefings (44 files total) using a TTS pipeline with native-quality voices per language; store as `/public/academy/<id>-briefing.<locale>.mp3`; update `LESSON_AUDIO` to be locale-keyed; player picks the file for the active locale.
- **Deliverable:** audio briefings in 4 languages.

### Phase F — Generated compliance documents
- Localize the PDF templates (DoC, end-user-info, technical-documentation, incident-report, etc.) with a per-document language selector at generation (defaults to UI locale; overridable to target-market language). Glossary-consistent legal terms.
- **Deliverable:** CRA documents generated in EN/DE/FR/IT.

## 7. Cross-cutting items
- **Dates/numbers:** route all formatting through next-intl/`useLocaleDate` so DE/FR/IT formats render correctly.
- **Quality gates each phase:** lint, typecheck, 266+ tests (add locale-completeness tests so a missing key fails CI), CI-env build; deploy to staging; visual verification in your logged-in browser.
- **No production promotion** until you explicitly approve (consistent with current workflow).
- **SEO/marketing pages:** localized too (pricing, landing, contact) — included in Phase B.

## 8. Open choices for you
1. **Audio voice:** one neutral professional voice family across languages, or a distinct native voice per language? (Phase E)
2. **Document language default:** follow the user's UI language, or always prompt for target-market language when generating? (Phase F — my recommendation: default to UI locale, always overridable.)
3. **Phase order / scope:** ship all six phases, or stop after any (e.g. UI + Copilot now, Academy audio + documents later)?

---

*Sequencing recommendation:* A → B → C give you a fully multilingual interface + assistant fastest. D → E → F complete the content + compliance deliverables. Each is independently shippable and reversible.
