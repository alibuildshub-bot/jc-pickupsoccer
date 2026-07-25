create extension if not exists pgcrypto;

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null default '/',
  referrer text,
  visitor_id text not null default gen_random_uuid()::text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Repair-safe setup: if the table already existed from an older/incomplete
-- script, add any missing columns before creating indexes.
alter table public.site_visits
  add column if not exists path text default '/',
  add column if not exists referrer text,
  add column if not exists visitor_id text default gen_random_uuid()::text,
  add column if not exists user_agent text,
  add column if not exists created_at timestamptz default now();

update public.site_visits
set path = '/'
where path is null;

update public.site_visits
set visitor_id = id::text
where visitor_id is null;

update public.site_visits
set created_at = now()
where created_at is null;

alter table public.site_visits
  alter column path set not null,
  alter column visitor_id set not null,
  alter column created_at set not null;

create index if not exists site_visits_created_at_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_id_idx on public.site_visits (visitor_id);
create index if not exists site_visits_path_idx on public.site_visits (path);

alter table public.site_visits enable row level security;

drop policy if exists "site visits are private" on public.site_visits;

-- No public select policy is added. The app writes and reads analytics through
-- server routes using the Supabase secret key.
