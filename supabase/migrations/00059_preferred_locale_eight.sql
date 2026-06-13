-- =============================================================================
-- 00059: Widen preferred_locale to the eight supported UI languages
-- The UI is being rolled out in all eight market languages (en/de/fr/it +
-- pl/es/pt/sv), matching the document languages. Migration 00041 limited
-- `preferred_locale` to four; widen the CHECK so users can save the new ones.
-- Replaces the auto-named inline constraint from 00041 with an explicit one.
-- =============================================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_preferred_locale_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_preferred_locale_check
    CHECK (preferred_locale IN ('en','de','fr','it','pl','es','pt','sv'));
