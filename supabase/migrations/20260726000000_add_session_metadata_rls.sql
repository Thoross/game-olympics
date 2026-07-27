-- The public-schema event trigger `rls_auto_enable` turned RLS on for these
-- tables at CREATE TABLE time, but the original migration added no policies —
-- which denied all access to the `authenticated` role. Add the standard
-- read-for-all / write-for-admins policy set used by the other domain tables.
-- (ENABLE is idempotent here and keeps the migration self-contained.)

alter table public.game_metadata_fields enable row level security;

create policy "game_metadata_fields_select" on public.game_metadata_fields
  for select to authenticated using (true);

create policy "game_metadata_fields_insert" on public.game_metadata_fields
  for insert to authenticated
  with check (public.get_user_role() = 'ADMIN'::public.player_role);

create policy "game_metadata_fields_update" on public.game_metadata_fields
  for update to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role)
  with check (public.get_user_role() = 'ADMIN'::public.player_role);

create policy "game_metadata_fields_delete" on public.game_metadata_fields
  for delete to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role);

alter table public.player_session_metadata enable row level security;

create policy "player_session_metadata_select" on public.player_session_metadata
  for select to authenticated using (true);

create policy "player_session_metadata_insert" on public.player_session_metadata
  for insert to authenticated
  with check (public.get_user_role() = 'ADMIN'::public.player_role);

create policy "player_session_metadata_update" on public.player_session_metadata
  for update to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role)
  with check (public.get_user_role() = 'ADMIN'::public.player_role);

create policy "player_session_metadata_delete" on public.player_session_metadata
  for delete to authenticated
  using (public.get_user_role() = 'ADMIN'::public.player_role);
