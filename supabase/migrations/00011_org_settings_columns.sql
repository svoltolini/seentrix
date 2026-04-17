-- Add address and language preference columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS language    text DEFAULT 'en' CHECK (language IN ('en', 'de')),
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS postal_code   text,
  ADD COLUMN IF NOT EXISTS city          text,
  ADD COLUMN IF NOT EXISTS country       text;
