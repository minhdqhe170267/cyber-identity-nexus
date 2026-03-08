
-- URL Shortener table
CREATE TABLE public.url_shortener (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url text NOT NULL,
  short_code text UNIQUE NOT NULL,
  clicks integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for url_shortener
ALTER TABLE public.url_shortener ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select url_shortener"
  ON public.url_shortener FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert url_shortener"
  ON public.url_shortener FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Pastes table
CREATE TABLE public.pastes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  language text DEFAULT 'plaintext',
  visibility text DEFAULT 'public',
  expires_at timestamp with time zone,
  views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for pastes
ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select public pastes"
  ON public.pastes FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public' OR visibility = 'unlisted');

CREATE POLICY "Anyone can insert pastes"
  ON public.pastes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow incrementing views and clicks via update
CREATE POLICY "Anyone can update url clicks"
  ON public.url_shortener FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can update paste views"
  ON public.pastes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
