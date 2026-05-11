-- ============================================================
-- Sistema de Victory Boxes
-- Bool Sinuca Premiere
-- ============================================================

CREATE TYPE public.box_type AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE public.box_status AS ENUM ('locked', 'unlocking', 'opened');

CREATE TABLE IF NOT EXISTS public.victory_boxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  box_type public.box_type NOT NULL DEFAULT 'common',
  status public.box_status NOT NULL DEFAULT 'locked',
  unlock_started_at timestamp with time zone,
  unlock_duration_seconds integer NOT NULL DEFAULT 10800, -- 3h default (common)
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  opened_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.victory_boxes IS 'Caixas de vitória ganhas após partidas';
COMMENT ON COLUMN public.victory_boxes.rewards IS 'JSON array de recompensas pré-geradas na criação da box';

-- Índices
CREATE INDEX IF NOT EXISTS idx_victory_boxes_profile ON public.victory_boxes(profile_id);
CREATE INDEX IF NOT EXISTS idx_victory_boxes_status ON public.victory_boxes(status);
CREATE INDEX IF NOT EXISTS idx_victory_boxes_profile_status ON public.victory_boxes(profile_id, status);

-- RLS
ALTER TABLE public.victory_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own boxes"
  ON public.victory_boxes FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Players can insert own boxes"
  ON public.victory_boxes FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Players can update own boxes"
  ON public.victory_boxes FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Players can delete own boxes"
  ON public.victory_boxes FOR DELETE
  USING (auth.uid() = profile_id);

-- Função para contar boxes ativas do jogador (não abertas)
CREATE OR REPLACE FUNCTION public.count_active_boxes(p_profile_id uuid)
RETURNS integer AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.victory_boxes
  WHERE profile_id = p_profile_id
    AND status != 'opened';
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar recompensas de box baseadas na raridade
CREATE OR REPLACE FUNCTION public.generate_box_rewards(p_box_type public.box_type)
RETURNS jsonb AS $$
DECLARE
  rewards jsonb := '[]'::jsonb;
  coin_reward integer;
  cash_reward integer;
BEGIN
  CASE p_box_type
    WHEN 'common' THEN
      coin_reward := floor(random() * 200 + 100)::integer;
      rewards := jsonb_build_array(
        jsonb_build_object('type', 'coins', 'amount', coin_reward)
      );
    WHEN 'rare' THEN
      coin_reward := floor(random() * 500 + 300)::integer;
      cash_reward := floor(random() * 5 + 2)::integer;
      rewards := jsonb_build_array(
        jsonb_build_object('type', 'coins', 'amount', coin_reward),
        jsonb_build_object('type', 'cash', 'amount', cash_reward)
      );
    WHEN 'epic' THEN
      coin_reward := floor(random() * 1000 + 500)::integer;
      cash_reward := floor(random() * 15 + 5)::integer;
      rewards := jsonb_build_array(
        jsonb_build_object('type', 'coins', 'amount', coin_reward),
        jsonb_build_object('type', 'cash', 'amount', cash_reward),
        jsonb_build_object('type', 'spin', 'amount', 1)
      );
    WHEN 'legendary' THEN
      coin_reward := floor(random() * 2500 + 1500)::integer;
      cash_reward := floor(random() * 50 + 20)::integer;
      rewards := jsonb_build_array(
        jsonb_build_object('type', 'coins', 'amount', coin_reward),
        jsonb_build_object('type', 'cash', 'amount', cash_reward),
        jsonb_build_object('type', 'spin', 'amount', 3),
        jsonb_build_object('type', 'box', 'amount', 1, 'name', 'Mystery Box')
      );
  END CASE;
  RETURN rewards;
END;
$$ LANGUAGE plpgsql;
