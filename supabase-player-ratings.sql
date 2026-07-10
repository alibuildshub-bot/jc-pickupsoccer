alter table public.match_players
add column if not exists minutes_played integer not null default 90,
add column if not exists match_rating numeric(3, 1),
add column if not exists rating_label text,
add column if not exists show_rating_public boolean not null default false;
