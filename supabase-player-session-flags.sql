create table if not exists public.player_session_flags (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  session_date date not null,
  exclude_from_averages boolean not null default true,
  reason text not null default 'goalie_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, session_date)
);

alter table public.player_session_flags enable row level security;

drop policy if exists "Public can read player session flags" on public.player_session_flags;
create policy "Public can read player session flags"
  on public.player_session_flags
  for select
  to anon, authenticated
  using (true);

grant select on public.player_session_flags to anon, authenticated;
grant all on public.player_session_flags to service_role;
