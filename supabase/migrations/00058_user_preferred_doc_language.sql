-- =============================================================================
-- 00058: Per-user default document language
-- The CRA requires customer-facing documents (the EU Declaration of
-- Conformity, Annex II user information) to be in the language of the market
-- where the product is sold. Generation now supports eight languages; this
-- stores each user's default choice so they set it once rather than picking on
-- every download. It is SEPARATE from preferred_locale (the UI language, which
-- is only translated into en/de/fr/it).
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_doc_language text NOT NULL DEFAULT 'en'
    CHECK (preferred_doc_language IN ('en','de','fr','it','pl','es','pt','sv'));

COMMENT ON COLUMN public.users.preferred_doc_language IS
  'Default output language for generated CRA documents (DoC, Annex II). Eight EU market languages; distinct from preferred_locale (UI language).';
