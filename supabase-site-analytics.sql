create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  visitor_id text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_id_idx on public.site_visits (visitor_id);
create index if not exists site_visits_path_idx on public.site_visits (path);

alter table public.site_visits enable row level security;

drop policy if exists "site visits are private" on public.site_visits;

-- No public select policy is added. The app writes and reads analytics through
-- server routes using the Supabase secret key.
