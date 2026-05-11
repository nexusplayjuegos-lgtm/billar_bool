-- ============================================================
-- Sistema de Loja Real (Catálogo + Inventário + Flash Deals)
-- Bool Sinuca Premiere
-- ============================================================

-- Catálogo de itens
CREATE TABLE IF NOT EXISTS public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('cue','table','coin','cash','special','avatar')),
  name text NOT NULL,
  description text,
  price_coins integer,
  price_cash integer,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  stats jsonb DEFAULT '{}'::jsonb,
  image_url text,
  is_limited boolean NOT NULL DEFAULT false,
  available_from timestamp with time zone DEFAULT timezone('utc'::text, now()),
  available_until timestamp with time zone,
  quantity_limit integer,
  quantity_sold integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.shop_items IS 'Catálogo de itens da loja (tacos, mesas, moedas, cash, etc)';
COMMENT ON COLUMN public.shop_items.stats IS 'JSON com stats de gameplay: { power, aim, spin, time }';

-- Inventário do jogador
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  UNIQUE(profile_id, item_id)
);

COMMENT ON TABLE public.player_inventory IS 'Itens comprados/equipados por cada jogador';

-- Ofertas relâmpago (flash deals)
CREATE TABLE IF NOT EXISTS public.flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 90),
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  max_purchases integer,
  purchases_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.flash_deals IS 'Ofertas relâmpago com desconto por tempo limitado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON public.shop_items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON public.shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_player_inventory_profile ON public.player_inventory(profile_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON public.flash_deals(is_active, end_at);

-- RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;

-- Shop items: todos podem ler itens ativos
CREATE POLICY "Shop items are viewable by everyone"
  ON public.shop_items FOR SELECT
  USING (is_active = true);

-- Player inventory: jogadores só veem seu próprio inventário
CREATE POLICY "Players can view own inventory"
  ON public.player_inventory FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Players can insert own inventory"
  ON public.player_inventory FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Players can update own inventory"
  ON public.player_inventory FOR UPDATE
  USING (auth.uid() = profile_id);

-- Flash deals: todos podem ver
CREATE POLICY "Flash deals are viewable by everyone"
  ON public.flash_deals FOR SELECT
  USING (true);

-- Trigger para limitar quantidade vendida
CREATE OR REPLACE FUNCTION public.check_quantity_limit()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.shop_items
    WHERE id = NEW.item_id
      AND quantity_limit IS NOT NULL
      AND quantity_sold >= quantity_limit
  ) THEN
    RAISE EXCEPTION 'Item esgotado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_quantity_limit ON public.player_inventory;

CREATE TRIGGER trg_check_quantity_limit
  BEFORE INSERT ON public.player_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.check_quantity_limit();

-- Função para atualizar equipped: desequipar itens da mesma categoria
CREATE OR REPLACE FUNCTION public.equip_item(p_profile_id uuid, p_item_id uuid)
RETURNS void AS $$
DECLARE
  v_category text;
BEGIN
  -- Buscar categoria do item
  SELECT category INTO v_category
  FROM public.shop_items
  WHERE id = p_item_id;

  -- Desequipar itens da mesma categoria
  UPDATE public.player_inventory
  SET equipped = false
  WHERE profile_id = p_profile_id
    AND item_id IN (
      SELECT id FROM public.shop_items WHERE category = v_category
    );

  -- Equipar o novo item
  INSERT INTO public.player_inventory (profile_id, item_id, equipped)
  VALUES (p_profile_id, p_item_id, true)
  ON CONFLICT (profile_id, item_id)
  DO UPDATE SET equipped = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
