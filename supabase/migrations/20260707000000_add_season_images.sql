-- Add optional logo + banner image URLs to seasons and a Storage bucket to hold
-- the uploaded files. Columns are nullable for backwards compat: existing
-- seasons keep null values and render nothing where the images would go.
-- No table-level RLS changes needed — the existing seasons_select / seasons_insert
-- / seasons_update policies already cover these new columns.
alter table public.seasons
  add column if not exists season_logo_url text,
  add column if not exists season_banner_url text;

-- Public Storage bucket for season art. Public read means images load via a plain
-- <img src> public URL (no signed URLs), matching how game images render.
insert into storage.buckets (id, name, public)
values ('season-images', 'season-images', true)
on conflict (id) do nothing;

-- Public read is served via the public bucket URL; writes are admin-only,
-- enforced by RLS on storage.objects scoped to this bucket.
create policy "season_images_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'season-images' and public.get_user_role() = 'ADMIN');

create policy "season_images_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'season-images' and public.get_user_role() = 'ADMIN')
  with check (bucket_id = 'season-images' and public.get_user_role() = 'ADMIN');

create policy "season_images_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'season-images' and public.get_user_role() = 'ADMIN');
