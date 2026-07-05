-- Add BoardGameGeek metadata columns to games. All nullable for backwards compat:
-- existing games (and games added without a BGG URL) keep null values.
-- No RLS changes needed — the table-level games_select / games_insert / games_update
-- policies already cover these new columns.
alter table public.games
  add column if not exists game_bgg_id integer,
  add column if not exists game_image_url text,
  add column if not exists game_description text,
  add column if not exists game_year_published integer,
  add column if not exists game_bgg_rating numeric,
  add column if not exists game_bgg_synced_at timestamp with time zone;
