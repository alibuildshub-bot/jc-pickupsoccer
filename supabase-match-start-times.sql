alter table public.matches
add column if not exists start_time time,
add column if not exists end_time time;
