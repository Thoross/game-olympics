-- season_games: one row per (season, game); records who chose the game for the season.
create table if not exists public.season_games (
  season_games_id uuid default gen_random_uuid() not null,
  season_id uuid not null,
  game_id uuid not null,
  chosen_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint season_games_pkey primary key (season_games_id),
  constraint season_games_season_game_key unique (season_id, game_id),
  constraint season_games_season_id_fkey foreign key (season_id)
    references public.seasons (season_id) on update cascade on delete cascade,
  constraint season_games_game_id_fkey foreign key (game_id)
    references public.games (game_id) on update cascade on delete cascade,
  constraint season_games_chosen_by_fkey foreign key (chosen_by)
    references public.player (player_id) on update cascade on delete set null
);

alter table public.season_games enable row level security;

create policy "season_games_select" on public.season_games
  for select to authenticated using (true);
create policy "season_games_insert" on public.season_games
  for insert to authenticated
  with check (public.get_user_role() = 'ADMIN'::public.player_role);
create policy "season_games_update" on public.season_games
  for update to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role)
  with check (public.get_user_role() = 'ADMIN'::public.player_role);
create policy "season_games_delete" on public.season_games
  for delete to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role);

-- Backfill: one chooser per (season, game), taking the earliest session's chooser.
insert into public.season_games (season_id, game_id, chosen_by)
select distinct on (s.season_id, s.game_id)
  s.season_id, s.game_id, s.chosen_by
from public.sessions s
where s.chosen_by is not null
order by s.season_id, s.game_id, s.session_date_played, s.session_id;

alter table public.sessions drop column chosen_by;
