CREATE TABLE public.game_scores_2048 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL,
  max_tile integer NOT NULL,
  moves integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.game_scores_2048 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select game_scores_2048" ON public.game_scores_2048 FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game_scores_2048" ON public.game_scores_2048 FOR INSERT WITH CHECK (true);