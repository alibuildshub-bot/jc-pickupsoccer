create table if not exists public.mvp_polls (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  title text not null,
  match_date date,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.mvp_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.mvp_polls(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mvp_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.mvp_polls(id) on delete cascade,
  option_id uuid not null references public.mvp_poll_options(id) on delete cascade,
  voter_key text not null,
  voter_name text,
  created_at timestamptz not null default now(),
  unique(poll_id, voter_key)
);

alter table public.mvp_polls enable row level security;
alter table public.mvp_poll_options enable row level security;
alter table public.mvp_votes enable row level security;

drop policy if exists "Public can read MVP polls" on public.mvp_polls;
drop policy if exists "Public can read MVP poll options" on public.mvp_poll_options;
drop policy if exists "Public can read MVP votes" on public.mvp_votes;

create policy "Public can read MVP polls"
on public.mvp_polls for select
to anon, authenticated
using (true);

create policy "Public can read MVP poll options"
on public.mvp_poll_options for select
to anon, authenticated
using (true);

create policy "Public can read MVP votes"
on public.mvp_votes for select
to anon, authenticated
using (true);

grant select on public.mvp_polls to anon, authenticated;
grant select on public.mvp_poll_options to anon, authenticated;
grant select on public.mvp_votes to anon, authenticated;
