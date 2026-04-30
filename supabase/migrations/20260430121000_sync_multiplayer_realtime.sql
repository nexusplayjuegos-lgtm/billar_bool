-- Ensure multiplayer rooms and shots are readable through Supabase Realtime.
-- Safe to run more than once.

create extension if not exists "uuid-ossp";

create table if not exists public.rooms (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  player_1_id uuid references public.profiles(id) on delete cascade not null,
  player_2_id uuid references public.profiles(id) on delete set null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished', 'abandoned')),
  game_mode text default '8ball' check (game_mode in ('8ball', 'brazilian', 'snooker')),
  current_turn uuid references public.profiles(id) on delete set null,
  winner_id uuid references public.profiles(id) on delete set null,
  bet_coins integer default 0
);

create table if not exists public.room_shots (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  room_id uuid references public.rooms(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  balls_state jsonb not null,
  game_state jsonb,
  aim_angle numeric not null,
  power numeric not null,
  spin_x numeric default 0,
  spin_y numeric default 0,
  shot_number integer not null
);

create table if not exists public.room_messages (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  room_id uuid references public.rooms(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  message_type text default 'quick'
);

alter table public.room_shots add column if not exists game_state jsonb;

create index if not exists idx_rooms_status_created_at
  on public.rooms(status, created_at desc);

create index if not exists idx_room_shots_room_created_at
  on public.room_shots(room_id, created_at);

create index if not exists idx_room_messages_room_created_at
  on public.room_messages(room_id, created_at);

alter table public.rooms enable row level security;
alter table public.room_shots enable row level security;
alter table public.room_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'Players can read multiplayer rooms'
  ) then
    create policy "Players can read multiplayer rooms"
      on public.rooms for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'Players can create own rooms'
  ) then
    create policy "Players can create own rooms"
      on public.rooms for insert
      to authenticated
      with check (auth.uid() = player_1_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'Players can update their rooms'
  ) then
    create policy "Players can update their rooms"
      on public.rooms for update
      to authenticated
      using (auth.uid() = player_1_id or auth.uid() = player_2_id or (status = 'waiting' and player_2_id is null))
      with check (auth.uid() = player_1_id or auth.uid() = player_2_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'room_shots' and policyname = 'Players can read room shots'
  ) then
    create policy "Players can read room shots"
      on public.room_shots for select
      to authenticated
      using (
        exists (
          select 1 from public.rooms r
          where r.id = room_id
            and (r.player_1_id = auth.uid() or r.player_2_id = auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'room_messages' and policyname = 'Players can read room messages'
  ) then
    create policy "Players can read room messages"
      on public.room_messages for select
      to authenticated
      using (
        exists (
          select 1 from public.rooms r
          where r.id = room_id
            and (r.player_1_id = auth.uid() or r.player_2_id = auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'room_messages' and policyname = 'Players can send room messages'
  ) then
    create policy "Players can send room messages"
      on public.room_messages for insert
      to authenticated
      with check (
        auth.uid() = player_id
        and exists (
          select 1 from public.rooms r
          where r.id = room_id
            and (r.player_1_id = auth.uid() or r.player_2_id = auth.uid())
        )
      );
  end if;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.room_shots;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.room_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
