-- ============================================================
-- BOOL SINUCA - SUPABASE SCHEMA
-- ============================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABELA DE PERFIS (sync com auth.users)
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  avatar_url text default null,
  
  -- Progresso
  level integer default 1,
  xp integer default 0,
  xp_to_next integer default 1000,
  
  -- Economia
  coins integer default 5000,
  cash integer default 0,
  
  -- Estatísticas
  stats jsonb default '{
    "totalGames": 0,
    "wins": 0,
    "losses": 0,
    "winRate": 0,
    "maxWinStreak": 0,
    "currentWinStreak": 0,
    "totalCoinsWon": 0,
    "bestBreak": 0
  }'::jsonb,
  
  -- Inventário
  owned_cues jsonb default '["cue_beginner"]'::jsonb,
  current_cue text default 'cue_beginner',
  owned_tables jsonb default '["table_classic_green"]'::jsonb,
  current_table text default 'table_classic_green',
  
  -- Configurações
  settings jsonb default '{
    "sound": true,
    "music": true,
    "vibration": true,
    "language": "pt",
    "notifications": true
  }'::jsonb,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  last_login timestamp with time zone default timezone('utc'::text, now())
);

-- Índices para performance
create index idx_profiles_username on profiles(username);
create index idx_profiles_level on profiles(level desc);
create index idx_profiles_coins on profiles(coins desc);

-- ============================================================
-- 2. TABELA DE PARTIDAS (HISTÓRICO)
-- ============================================================
create table matches (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references profiles(id) on delete cascade not null,
  
  -- Info da partida
  mode text not null, -- '8ball', 'brazilian', 'snooker'
  difficulty text default 'medium', -- 'easy', 'medium', 'hard'
  opponent_type text default 'bot', -- 'bot', 'player'
  opponent_id uuid references profiles(id) on delete set null,
  
  -- Resultado
  result text check (result in ('win', 'loss', 'draw')) not null,
  player_score integer default 0,
  opponent_score integer default 0,
  
  -- Economia
  coins_bet integer default 0,
  coins_won integer default 0,
  xp_gained integer default 0,
  
  -- Detalhes
  duration_seconds integer default 0,
  shots_count integer default 0,
  balls_pocketed integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Índices
create index idx_matches_player_id on matches(player_id);
create index idx_matches_created_at on matches(created_at desc);
create index idx_matches_mode on matches(mode);

-- ============================================================
-- 3. TABELA DE LEADERBOARD (RANKING)
-- ============================================================
create table leaderboard (
  user_id uuid references profiles(id) on delete cascade primary key,
  username text not null,
  avatar_url text,
  
  -- Rankings
  rank_global integer,
  rank_weekly integer,
  rank_monthly integer,
  
  -- Stats agregadas (atualizadas por trigger)
  weekly_wins integer default 0,
  weekly_coins integer default 0,
  monthly_wins integer default 0,
  total_wins integer default 0,
  total_coins_won integer default 0,
  
  -- Sequências
  current_win_streak integer default 0,
  best_win_streak integer default 0,
  
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Índices
create index idx_leaderboard_rank_global on leaderboard(rank_global);
create index idx_leaderboard_weekly_wins on leaderboard(weekly_wins desc);

-- ============================================================
-- 4. TABELA DE RECOMPENSAS DIÁRIAS (DAILY REWARDS)
-- ============================================================
create table daily_rewards (
  user_id uuid references profiles(id) on delete cascade primary key,
  streak_days integer default 0,
  last_claim_date date default null,
  total_claimed integer default 0,
  
  -- Histórico dos últimos 7 dias
  history jsonb default '[]'::jsonb
);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ============================================================

-- Perfis: usuários só veem/editam seus próprios dados
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Matches: só dono pode ver suas partidas
alter table matches enable row level security;

create policy "Users can view own matches"
  on matches for select
  using (auth.uid() = player_id);

create policy "Users can insert own matches"
  on matches for insert
  with check (auth.uid() = player_id);

-- Leaderboard: público (todo mundo vê)
alter table leaderboard enable row level security;

create policy "Leaderboard is public read"
  on leaderboard for select
  to authenticated, anon
  using (true);

-- Daily Rewards: só dono
alter table daily_rewards enable row level security;

create policy "Users manage own rewards"
  on daily_rewards for all
  using (auth.uid() = user_id);

-- ============================================================
-- 6. FUNÇÕES E TRIGGERS
-- ============================================================

-- Trigger: atualizar updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- Trigger: criar perfil automaticamente após signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  );
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Função: atualizar leaderboard
create or replace function update_leaderboard(p_user_id uuid)
returns void as $$
declare
  v_weekly_wins integer;
  v_total_wins integer;
  v_total_coins integer;
begin
  -- Calcular stats
  select count(*) into v_weekly_wins
  from matches
  where player_id = p_user_id
    and result = 'win'
    and created_at > now() - interval '7 days';
  
  select 
    (stats->>'wins')::int,
    (stats->>'totalCoinsWon')::int
  into v_total_wins, v_total_coins
  from profiles
  where id = p_user_id;
  
  -- Atualizar ou inserir no leaderboard
  insert into leaderboard (
    user_id, username, avatar_url,
    weekly_wins, total_wins, total_coins_won
  )
  select 
    p.id, p.username, p.avatar_url,
    v_weekly_wins, v_total_wins, v_total_coins
  from profiles p
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

-- ============================================================
-- 7. DADOS INICIAIS (OPCIONAL)
-- ============================================================

-- Criar alguns bots para o leaderboard inicial
insert into profiles (id, username, email, level, coins, stats)
values 
  (uuid_generate_v4(), 'Efren Reyes', 'bot1@bool.local', 147, 999999999, '{"wins": 5000, "losses": 100, "totalGames": 5100}'::jsonb),
  (uuid_generate_v4(), 'Ronnie O''Sullivan', 'bot2@bool.local', 145, 875000000, '{"wins": 4800, "losses": 200, "totalGames": 5000}'::jsonb),
  (uuid_generate_v4(), 'Sinucão_BR', 'bot3@bool.local', 132, 754200000, '{"wins": 4200, "losses": 300, "totalGames": 4500}'::jsonb)
on conflict do nothing;

-- Atualizar leaderboard com bots
select update_leaderboard(id) from profiles where email like 'bot%@bool.local';