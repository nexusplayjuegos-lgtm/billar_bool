-- ============================================================
-- Complete RLS Policies for All Tables
-- Bool Sinuca Premiere
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- SEASON PASSES (public read)
-- ============================================================
ALTER TABLE public.season_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Season passes are viewable by everyone"
  ON public.season_passes FOR SELECT
  USING (true);

-- ============================================================
-- PLAYER SEASON PROGRESS (own only)
-- ============================================================
ALTER TABLE public.player_season_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Players can view own season progress"
  ON public.player_season_progress FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can insert own season progress"
  ON public.player_season_progress FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can update own season progress"
  ON public.player_season_progress FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can delete own season progress"
  ON public.player_season_progress FOR DELETE
  USING (auth.uid() = profile_id);

-- ============================================================
-- VICTORY BOXES (own only)
-- ============================================================
ALTER TABLE public.victory_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Players can view own boxes"
  ON public.victory_boxes FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can insert own boxes"
  ON public.victory_boxes FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can update own boxes"
  ON public.victory_boxes FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can delete own boxes"
  ON public.victory_boxes FOR DELETE
  USING (auth.uid() = profile_id);

-- ============================================================
-- SHOP ITEMS (public read)
-- ============================================================
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Shop items are viewable by everyone"
  ON public.shop_items FOR SELECT
  USING (true);

-- ============================================================
-- FLASH DEALS (public read)
-- ============================================================
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Flash deals are viewable by everyone"
  ON public.flash_deals FOR SELECT
  USING (true);

-- ============================================================
-- PLAYER INVENTORY (own only)
-- ============================================================
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Players can view own inventory"
  ON public.player_inventory FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can insert own inventory"
  ON public.player_inventory FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can update own inventory"
  ON public.player_inventory FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Players can delete own inventory"
  ON public.player_inventory FOR DELETE
  USING (auth.uid() = profile_id);
