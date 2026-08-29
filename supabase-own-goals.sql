alter table public.match_players
add column if not exists own_goals integer not null default 0;

update public.match_players
set own_goals = 0
where own_goals is null;
