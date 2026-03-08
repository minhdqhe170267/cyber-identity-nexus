
DROP TABLE IF EXISTS public.typing_scores;

CREATE TABLE public.typing_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  wpm integer NOT NULL,
  raw_wpm integer NOT NULL,
  accuracy numeric NOT NULL,
  consistency numeric NOT NULL,
  mode text NOT NULL,
  mode_value text NOT NULL,
  duration_seconds integer,
  word_count integer,
  correct_chars integer NOT NULL,
  incorrect_chars integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE POLICY "Anyone can select typing_scores"
  ON public.typing_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert typing_scores"
  ON public.typing_scores FOR INSERT
  WITH CHECK (true);
