-- Add status column to documents table
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_started'
  CHECK (status IN ('not_started', 'draft', 'final'));
