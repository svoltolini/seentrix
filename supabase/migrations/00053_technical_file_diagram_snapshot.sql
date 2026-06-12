-- =============================================================================
-- 00053: Technical file ↔ diagram snapshot
--
-- A released technical file's PDF already freezes the drawings (PNGs are
-- embedded), but the app had no structured record of WHICH diagram versions
-- went in. `diagrams_snapshot` captures `[{id, type, title, version}]` at
-- every PDF build (so the release-time rebuild pins the exact set). The UI
-- lists it per released version, and diagram versions referenced by a
-- released/archived technical file are protected from deletion so the
-- editable source of the Annex VII trail survives alongside the PDF.
-- =============================================================================

ALTER TABLE public.technical_files
  ADD COLUMN diagrams_snapshot jsonb;
