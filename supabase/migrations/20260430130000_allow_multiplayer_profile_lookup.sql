-- Let authenticated players resolve opponent names in multiplayer HUDs.
-- Profiles still require separate policies for updates.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Authenticated users can view player profiles'
  ) then
    create policy "Authenticated users can view player profiles"
      on public.profiles for select
      to authenticated
      using (true);
  end if;
end;
$$;
