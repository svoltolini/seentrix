CREATE TABLE public.newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  locale     text NOT NULL DEFAULT 'en',
  source     text NOT NULL DEFAULT 'landing_page',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX newsletter_subscribers_email_idx ON public.newsletter_subscribers (email);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);
