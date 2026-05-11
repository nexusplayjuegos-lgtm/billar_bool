-- ============================================================
-- Ensure profiles table and auth trigger exist
-- Bool Sinuca Premiere
-- ============================================================

-- Create profiles table if not exists (sync with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text DEFAULT NULL,
  
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  xp_to_next integer DEFAULT 1000,
  
  coins integer DEFAULT 5000,
  cash integer DEFAULT 0,
  
  stats jsonb DEFAULT '{
    "totalGames": 0,
    "wins": 0,
    "losses": 0,
    "winRate": 0,
    "maxWinStreak": 0,
    "currentWinStreak": 0,
    "totalCoinsWon": 0,
    "bestBreak": 0
  }'::jsonb,
  
  owned_cues jsonb DEFAULT '["cue_beginner"]'::jsonb,
  current_cue text DEFAULT 'cue_beginner',
  owned_tables jsonb DEFAULT '["table_classic_green"]'::jsonb,
  current_table text DEFAULT 'table_classic_green',
  
  settings jsonb DEFAULT '{
    "sound": true,
    "music": true,
    "vibration": true,
    "language": "pt",
    "notifications": true
  }'::jsonb,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_coins ON public.profiles(coins DESC);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: auto-create profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Backfill: create profiles for existing auth.users without profile
INSERT INTO public.profiles (id, username, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  COALESCE(au.email, 'user_' || au.id::text || '@example.com')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
