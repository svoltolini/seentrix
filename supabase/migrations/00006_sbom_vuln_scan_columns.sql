-- =========================================================================
-- 00006: Add vulnerability scan tracking columns to sboms table
-- =========================================================================

ALTER TABLE public.sboms
  ADD COLUMN IF NOT EXISTS last_scanned_at   timestamptz,
  ADD COLUMN IF NOT EXISTS vulnerability_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_count        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_count      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_count         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kev_count         integer DEFAULT 0;
