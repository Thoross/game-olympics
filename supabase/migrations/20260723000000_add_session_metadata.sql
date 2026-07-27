-- Per-game metadata field definitions (e.g. "Class", "Faction").
create table public.game_metadata_fields (
  field_id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (game_id) on delete cascade,
  field_name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint game_metadata_fields_game_name_unique unique (game_id, field_name)
);

-- Recorded per-player-session values, keyed by field definition.
create table public.player_session_metadata (
  id uuid primary key default gen_random_uuid(),
  player_session_id uuid not null
    references public.player_sessions (player_session_id) on delete cascade,
  field_id uuid not null
    references public.game_metadata_fields (field_id) on delete cascade,
  value text not null,
  constraint player_session_metadata_unique unique (player_session_id, field_id)
);

-- Autocomplete and stats grouping both filter/aggregate by field_id.
create index player_session_metadata_field_id_idx
  on public.player_session_metadata (field_id);

create index game_metadata_fields_game_id_idx
  on public.game_metadata_fields (game_id);
