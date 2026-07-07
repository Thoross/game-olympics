import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/database.types'

export const SEASON_IMAGE_BUCKET = 'season-images'
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export type SeasonImageKind = 'logo' | 'banner'

// Returns an error message, or null if the file is a valid image upload.
export function validateImageUpload(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]))
    return 'Image must be PNG, JPEG, or WebP.'
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.'
  return null
}

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

// e.g. "<seasonId>/logo-1720300000000.png"
export function buildObjectPath(seasonId: string, kind: SeasonImageKind, file: File): string {
  return `${seasonId}/${kind}-${Date.now()}.${EXT[file.type] ?? 'bin'}`
}

// Derive the in-bucket object path from a stored public URL. Returns null when the
// URL does not point at this bucket. Used for best-effort cleanup of old objects.
export function objectPathFromPublicUrl(url: string): string | null {
  const marker = `/${SEASON_IMAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length)
  return path.length > 0 ? path : null
}

// Uploads a validated file and returns its public URL, or a { error } message.
// Uses the request-scoped `locals.supabase`, so it stays RLS-bound.
export async function uploadSeasonImage(
  supabase: SupabaseClient<Database>,
  seasonId: string,
  kind: SeasonImageKind,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const invalid = validateImageUpload(file)
  if (invalid) return { error: invalid }
  const path = buildObjectPath(seasonId, kind, file)
  const { error } = await supabase.storage
    .from(SEASON_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: 'Failed to upload image.' }
  const { data } = supabase.storage.from(SEASON_IMAGE_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

// Best-effort deletion of a previously stored object. Errors are ignored so
// cleanup failures never block a save.
export async function removeSeasonImageByUrl(
  supabase: SupabaseClient<Database>,
  url: string | null | undefined,
): Promise<void> {
  if (!url) return
  const path = objectPathFromPublicUrl(url)
  if (!path) return
  await supabase.storage
    .from(SEASON_IMAGE_BUCKET)
    .remove([path])
    .catch(() => {})
}
