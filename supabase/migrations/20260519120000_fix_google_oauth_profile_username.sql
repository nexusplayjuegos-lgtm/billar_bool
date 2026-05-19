-- ============================================================
-- Fix Google OAuth profile creation without username metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_profile_username(
  user_id uuid,
  user_email text,
  user_metadata jsonb
)
RETURNS text AS $$
DECLARE
  base_username text;
  profile_username text;
  suffix integer := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(btrim(user_metadata->>'username'), ''),
    NULLIF(btrim(user_metadata->>'name'), ''),
    NULLIF(btrim(user_metadata->>'full_name'), ''),
    NULLIF(btrim(split_part(COALESCE(user_email, ''), '@', 1)), ''),
    'user_' || substr(user_id::text, 1, 8)
  );

  base_username := lower(regexp_replace(base_username, '[^[:alnum:]_]+', '_', 'g'));
  base_username := btrim(regexp_replace(base_username, '_+', '_', 'g'), '_');
  base_username := COALESCE(NULLIF(base_username, ''), 'user_' || substr(user_id::text, 1, 8));
  profile_username := base_username;

  WHILE EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = profile_username
  ) LOOP
    suffix := suffix + 1;
    profile_username := base_username || '_' || substr(user_id::text, 1, 4);

    IF suffix > 1 THEN
      profile_username := profile_username || '_' || suffix::text;
    END IF;
  END LOOP;

  RETURN profile_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    new.id,
    public.generate_profile_username(new.id, new.email, new.raw_user_meta_data),
    COALESCE(new.email, new.id::text || '@auth.local'),
    new.raw_user_meta_data->>'avatar_url'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  auth_user record;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, username, email, avatar_url)
    VALUES (
      auth_user.id,
      public.generate_profile_username(auth_user.id, auth_user.email, auth_user.raw_user_meta_data),
      COALESCE(auth_user.email, auth_user.id::text || '@auth.local'),
      auth_user.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;
