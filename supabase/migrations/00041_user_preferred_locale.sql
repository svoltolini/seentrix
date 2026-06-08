-- =============================================================================
-- 00041: Per-user preferred UI locale
--
-- Seentrix is going multilingual (English, German, French, Italian). Each user
-- can choose the language the entire product renders in — UI, Academy, the AI
-- Copilot, and generated documents. We persist that choice on the user's own
-- `public.users` row so it survives across devices/sessions (a cookie mirrors
-- it for instant SSR, but the row is the source of truth).
--
-- Default 'en' keeps every existing user on English until they pick otherwise.
-- The CHECK constraint pins the column to the four supported locales so a bad
-- value can't slip in and break the message loader's locale negotiation.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN preferred_locale text NOT NULL DEFAULT 'en'
    CHECK (preferred_locale IN ('en', 'de', 'fr', 'it'));

COMMENT ON COLUMN public.users.preferred_locale IS
  'User-selected UI language (en|de|fr|it). Source of truth for locale; the NEXT_LOCALE cookie mirrors it for SSR.';

-- No new RLS needed: the existing users_update policy already scopes updates to
-- the caller's org, and the app action further restricts the locale update to
-- the caller''s own row (id = auth.uid()).
