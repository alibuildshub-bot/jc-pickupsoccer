alter table public.tournament_teams
add column if not exists session_date date;

create index if not exists tournament_teams_session_date_idx
on public.tournament_teams (session_date);
