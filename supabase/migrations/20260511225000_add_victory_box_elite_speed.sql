-- ============================================================
-- Add is_elite_speed flag to victory_boxes
-- Bool Sinuca Premiere
-- ============================================================

ALTER TABLE public.victory_boxes
ADD COLUMN IF NOT EXISTS is_elite_speed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.victory_boxes.is_elite_speed IS 'Indica se a box foi criada com velocidade Elite (3x mais rápido)';
