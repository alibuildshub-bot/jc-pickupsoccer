alter table public.tournament_teams
add column if not exists session_start_time time,
add column if not exists session_end_time time,
add column if not exists session_location text;
