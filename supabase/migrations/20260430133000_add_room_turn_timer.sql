-- Track turn start time separately from generic room updates.

alter table public.rooms
  add column if not exists turn_started_at timestamp with time zone default timezone('utc'::text, now());

update public.rooms
set turn_started_at = coalesce(turn_started_at, updated_at, created_at, timezone('utc'::text, now()));

create or replace function public.update_room_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_rooms_updated_at on public.rooms;

create trigger update_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.update_room_updated_at();
