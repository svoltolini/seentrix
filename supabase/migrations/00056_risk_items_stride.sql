-- =============================================================================
-- 00056: Optional STRIDE categorization on risk-assessment items
--
-- The CRA requires a documented cybersecurity risk assessment but is
-- methodology-agnostic; STRIDE is the conventional way to make the threat
-- analysis defensible at audit. Each risk-assessment item can now OPTIONALLY
-- be tagged with the STRIDE categories its threat covers. Nothing validates
-- or requires these — releasing an assessment works exactly as before.
-- =============================================================================

ALTER TABLE public.risk_assessment_items
  ADD COLUMN stride_categories text[] NOT NULL DEFAULT '{}'
  CONSTRAINT risk_items_stride_valid CHECK (
    stride_categories <@ ARRAY[
      'spoofing',
      'tampering',
      'repudiation',
      'info_disclosure',
      'denial_of_service',
      'elevation_of_privilege'
    ]::text[]
  );

COMMENT ON COLUMN public.risk_assessment_items.stride_categories IS
  'Optional STRIDE threat categories this item''s threat analysis covers. '
  'Never required — the CRA does not mandate a specific methodology.';
