-- ============================================================
-- Sistema de Missões Diárias e Desafios Semanais
-- Bool Sinuca Premiere
-- ============================================================

-- Missões diárias do jogador
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  missions JSONB NOT NULL DEFAULT '[]'::jsonb,
  all_completed BOOLEAN NOT NULL DEFAULT false,
  all_claimed BOOLEAN NOT NULL DEFAULT false,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(profile_id, date)
);

-- Desafios semanais do jogador
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  all_completed BOOLEAN NOT NULL DEFAULT false,
  all_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(profile_id, week_start)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_daily_missions_profile_date ON public.daily_missions(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_profile_week ON public.weekly_challenges(profile_id, week_start);

-- RLS
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own daily missions" ON public.daily_missions;
CREATE POLICY "Players can view own daily missions" ON public.daily_missions FOR SELECT TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can insert own daily missions" ON public.daily_missions;
CREATE POLICY "Players can insert own daily missions" ON public.daily_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can update own daily missions" ON public.daily_missions;
CREATE POLICY "Players can update own daily missions" ON public.daily_missions FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can view own weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Players can view own weekly challenges" ON public.weekly_challenges FOR SELECT TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can insert own weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Players can insert own weekly challenges" ON public.weekly_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can update own weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Players can update own weekly challenges" ON public.weekly_challenges FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

-- Trigger: atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_missions_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_missions_updated_at ON public.daily_missions;
CREATE TRIGGER update_daily_missions_updated_at
  BEFORE UPDATE ON public.daily_missions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_missions_updated_at();

DROP TRIGGER IF EXISTS update_weekly_challenges_updated_at ON public.weekly_challenges;
CREATE TRIGGER update_weekly_challenges_updated_at
  BEFORE UPDATE ON public.weekly_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_missions_updated_at();
