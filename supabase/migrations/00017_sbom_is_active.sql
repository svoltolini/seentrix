-- =========================================================================
-- 00017: Add is_active flag to sboms for managing multiple SBOMs
-- =========================================================================

ALTER TABLE public.sboms
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
