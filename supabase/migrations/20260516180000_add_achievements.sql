-- ============================================================
-- Sistema de Conquistas Permanentes
-- Bool Sinuca Premiere
-- ============================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('wins', 'skills', 'collection', 'social')),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  reward_coins INTEGER NOT NULL DEFAULT 0,
  reward_cash INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(profile_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_profile ON public.player_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement ON public.player_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Players can view own achievements" ON public.player_achievements;
CREATE POLICY "Players can view own achievements"
  ON public.player_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can insert own achievements" ON public.player_achievements;
CREATE POLICY "Players can insert own achievements"
  ON public.player_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can update own achievements" ON public.player_achievements;
CREATE POLICY "Players can update own achievements"
  ON public.player_achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE OR REPLACE FUNCTION public.update_player_achievements_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_player_achievements_updated_at ON public.player_achievements;
CREATE TRIGGER update_player_achievements_updated_at
  BEFORE UPDATE ON public.player_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_player_achievements_updated_at();

INSERT INTO public.achievements
  (code, title, description, category, tier, target_value, reward_coins, reward_cash, reward_xp)
VALUES
  ('first_win', 'Primeira Vitoria', 'Venca sua primeira partida', 'wins', 1, 1, 500, 0, 100),
  ('win_streak_3', 'Sequencia de 3', 'Venca 3 partidas seguidas', 'wins', 2, 3, 1000, 5, 200),
  ('win_streak_10', 'Invencivel', 'Venca 10 partidas seguidas', 'wins', 4, 10, 5000, 50, 1000),
  ('total_wins_100', 'Veterano', 'Venca 100 partidas no total', 'wins', 3, 100, 2000, 20, 500),
  ('total_wins_1000', 'Lenda', 'Venca 1000 partidas no total', 'wins', 4, 1000, 10000, 100, 5000),
  ('perfect_break', 'Break Perfeito', 'Encaçape uma bola no break', 'skills', 1, 1, 300, 0, 50),
  ('no_foul_win', 'Jogo Limpo', 'Venca sem cometer nenhuma falta', 'skills', 2, 10, 1500, 10, 300),
  ('bank_shot', 'Mestre da Tabela', 'Faca 50 tacadas de tabela', 'skills', 2, 50, 1000, 5, 200),
  ('combo_shot', 'Combo', 'Encaçape 3 bolas em uma tacada', 'skills', 3, 1, 2000, 20, 400),
  ('power_100', 'Forca Maxima', 'Use 100% de potencia 50 vezes', 'skills', 2, 50, 800, 0, 150),
  ('first_cue', 'Meu Primeiro Taco', 'Compre seu primeiro taco', 'collection', 1, 1, 200, 0, 50),
  ('cue_collector', 'Colecionador', 'Tenha 10 tacos diferentes', 'collection', 2, 10, 1500, 10, 300),
  ('table_collector', 'Dono de Mesa', 'Tenha 5 mesas diferentes', 'collection', 2, 5, 1000, 5, 200),
  ('legendary_item', 'Lendario', 'Obtenha um item Lendario', 'collection', 3, 1, 3000, 30, 500),
  ('first_friend', 'Primeiro Amigo', 'Adicione um amigo', 'social', 1, 1, 200, 0, 50),
  ('popular', 'Popular', 'Tenha 50 amigos', 'social', 3, 50, 2000, 20, 400),
  ('share_result', 'Compartilhador', 'Compartilhe 10 resultados', 'social', 1, 10, 500, 0, 100)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  target_value = EXCLUDED.target_value,
  reward_coins = EXCLUDED.reward_coins,
  reward_cash = EXCLUDED.reward_cash,
  reward_xp = EXCLUDED.reward_xp;
