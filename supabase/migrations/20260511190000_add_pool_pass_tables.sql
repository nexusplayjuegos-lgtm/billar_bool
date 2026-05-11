-- ============================================================
-- Sistema de Pool Pass (Season Pass)
-- Bool Sinuca Premiere
-- ============================================================

-- Tabela de configuração de temporadas/seasons
CREATE TABLE IF NOT EXISTS public.season_passes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  free_rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  premium_rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  elite_rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.season_passes IS 'Configuração de cada temporada do Pool Pass';
COMMENT ON COLUMN public.season_passes.theme IS 'JSON com cores, imagem de fundo, etc: {primaryColor, secondaryColor, backgroundImage, badgeIcon}';
COMMENT ON COLUMN public.season_passes.free_rewards IS 'Array de 50 recompensas gratuitas';
COMMENT ON COLUMN public.season_passes.premium_rewards IS 'Array de 50 recompensas premium';
COMMENT ON COLUMN public.season_passes.elite_rewards IS 'Array de 50 recompensas elite (bônus adicionais)';

-- Tabela de progresso do jogador na season
CREATE TABLE IF NOT EXISTS public.player_season_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.season_passes(id) ON DELETE CASCADE,
  current_rank integer NOT NULL DEFAULT 1,
  pool_points integer NOT NULL DEFAULT 0,
  has_premium boolean NOT NULL DEFAULT false,
  has_elite boolean NOT NULL DEFAULT false,
  rewards_claimed integer[] NOT NULL DEFAULT '{}'::integer[],
  premium_claimed integer[] NOT NULL DEFAULT '{}'::integer[],
  elite_claimed integer[] NOT NULL DEFAULT '{}'::integer[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (profile_id, season_id)
);

COMMENT ON TABLE public.player_season_progress IS 'Progresso de cada jogador em cada temporada';

-- Índices
CREATE INDEX IF NOT EXISTS idx_player_season_progress_profile ON public.player_season_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_player_season_progress_season ON public.player_season_progress(season_id);
CREATE INDEX IF NOT EXISTS idx_season_passes_active ON public.season_passes(start_date, end_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_player_season_progress_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_player_season_progress_updated_at ON public.player_season_progress;

CREATE TRIGGER update_player_season_progress_updated_at
  BEFORE UPDATE ON public.player_season_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_player_season_progress_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.season_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_season_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para season_passes: todos podem ler
CREATE POLICY "Season passes are viewable by everyone"
  ON public.season_passes FOR SELECT
  USING (true);

-- Políticas para player_season_progress: jogadores só veem seu próprio progresso
CREATE POLICY "Players can view own season progress"
  ON public.player_season_progress FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Players can insert own season progress"
  ON public.player_season_progress FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Players can update own season progress"
  ON public.player_season_progress FOR UPDATE
  USING (auth.uid() = profile_id);

-- Função para criar progresso automaticamente quando season inicia
CREATE OR REPLACE FUNCTION public.create_season_progress_for_new_users()
RETURNS trigger AS $$
DECLARE
  active_season uuid;
BEGIN
  -- Encontra a season ativa
  SELECT id INTO active_season
  FROM public.season_passes
  WHERE start_date <= timezone('utc'::text, now())
    AND end_date >= timezone('utc'::text, now())
  ORDER BY season_number DESC
  LIMIT 1;

  -- Se houver season ativa, cria progresso zerado
  IF active_season IS NOT NULL THEN
    INSERT INTO public.player_season_progress (profile_id, season_id, current_rank, pool_points)
    VALUES (new.id, active_season, 1, 0)
    ON CONFLICT (profile_id, season_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_season_progress ON public.profiles;

CREATE TRIGGER auto_create_season_progress
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_season_progress_for_new_users();
