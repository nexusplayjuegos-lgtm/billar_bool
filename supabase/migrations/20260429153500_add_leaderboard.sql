-- Sync missing leaderboard objects for the current Supabase project.
-- Safe to run more than once.

create extension if not exists "uuid-ossp";

create table if not exists public.leaderboard (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  username text not null,
  avatar_url text,
  rank_global integer,
  rank_weekly integer,
  rank_monthly integer,
  weekly_wins integer default 0,
  weekly_coins integer default 0,
  monthly_wins integer default 0,
  total_wins integer default 0,
  total_coins_won integer default 0,
  current_win_streak integer default 0,
  best_win_streak integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists idx_leaderboard_rank_global
  on public.leaderboard(rank_global);

create index if not exists idx_leaderboard_weekly_wins
  on public.leaderboard(weekly_wins desc);

alter table public.leaderboard enable row level security;

create table if not exists public.daily_rewards (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  streak_days integer default 0,
  last_claim_date date default null,
  total_claimed integer default 0,
  history jsonb default '[]'::jsonb
);

alter table public.daily_rewards enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leaderboard'
      and policyname = 'Leaderboard is public read'
  ) then
    create policy "Leaderboard is public read"
      on public.leaderboard for select
      to authenticated, anon
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'daily_rewards'
      and policyname = 'Users manage own rewards'
  ) then
    create policy "Users manage own rewards"
      on public.daily_rewards for all
      using (auth.uid() = user_id);
  end if;
end;
$$;

create or replace function public.update_leaderboard(p_user_id uuid)
returns void as $$
declare
  v_weekly_wins integer := 0;
  v_total_wins integer := 0;
  v_total_coins integer := 0;
begin
  select count(*) into v_weekly_wins
  from public.matches
  where player_id = p_user_id
    and result = 'win'
    and created_at > now() - interval '7 days';

  select
    coalesce((stats->>'wins')::int, 0),
    coalesce((stats->>'totalCoinsWon')::int, 0)
  into v_total_wins, v_total_coins
  from public.profiles
  where id = p_user_id;

  insert into public.leaderboard (
    user_id,
    username,
    avatar_url,
    weekly_wins,
    total_wins,
    total_coins_won
  )
  select
    p.id,
    p.username,
    p.avatar_url,
    v_weekly_wins,
    v_total_wins,
    v_total_coins
  from public.profiles p
  where p.id = p_user_id
  on conflict (user_id) do update set
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    weekly_wins = excluded.weekly_wins,
    total_wins = excluded.total_wins,
    total_coins_won = excluded.total_coins_won,
    updated_at = timezone('utc'::text, now());
end;
$$ language plpgsql;

select public.update_leaderboard(id)
from public.profiles
where email like 'bot%@bool.local';
