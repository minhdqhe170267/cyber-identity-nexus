
CREATE TABLE public.typing_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  wpm integer NOT NULL,
  accuracy numeric NOT NULL,
  mode text NOT NULL,
  duration integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS policies
CREATE POLICY "Anyone can select typing_scores"
  ON public.typing_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert typing_scores"
  ON public.typing_scores FOR INSERT
  WITH CHECK (true);
