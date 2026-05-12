-- Fix RLS Policies v2 - Sem IF NOT EXISTS
-- Bool Sinuca Premiere

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- SEASON PASSES (public read)
ALTER TABLE public.season_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Season passes are viewable by everyone" ON public.season_passes;
CREATE POLICY "Season passes are viewable by everyone" ON public.season_passes FOR SELECT TO anon, authenticated USING (true);

-- PLAYER SEASON PROGRESS (own only)
ALTER TABLE public.player_season_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own season progress" ON public.player_season_progress;
CREATE POLICY "Players can view own season progress" ON public.player_season_progress FOR SELECT TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can insert own season progress" ON public.player_season_progress;
CREATE POLICY "Players can insert own season progress" ON public.player_season_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Players can update own season progress" ON public.player_season_progress;
CREATE POLICY "Players can update own season progress" ON public.player_season_progress FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

-- VICTORY BOXES (own only)
ALTER TABLE public.victory_boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own boxes" ON public.victory_boxes;
CREATE POLICY "Players can view own boxes" ON public.victory_boxes FOR SELECT TO authenticated USING (auth.uid() = profile_id);

-- SHOP ITEMS (public read)
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shop items are viewable by everyone" ON public.shop_items;
CREATE POLICY "Shop items are viewable by everyone" ON public.shop_items FOR SELECT TO anon, authenticated USING (true);

-- FLASH DEALS (public read)
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Flash deals are viewable by everyone" ON public.flash_deals;
CREATE POLICY "Flash deals are viewable by everyone" ON public.flash_deals FOR SELECT TO anon, authenticated USING (true);

-- PLAYER INVENTORY (own only)
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own inventory" ON public.player_inventory;
CREATE POLICY "Players can view own inventory" ON public.player_inventory FOR SELECT TO authenticated USING (auth.uid() = profile_id);
