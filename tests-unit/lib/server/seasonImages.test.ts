import { describe, it, expect } from 'vitest'
import {
  MAX_IMAGE_BYTES,
  buildObjectPath,
  objectPathFromPublicUrl,
  validateImageUpload,
  SEASON_IMAGE_BUCKET,
} from '$lib/server/seasonImages'

// Build a File-like object with a controllable size without allocating real bytes.
function fakeFile(type: string, size: number, name = 'image'): File {
  const file = new File([], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateImageUpload', () => {
  it('accepts png/jpeg/webp within the size limit', () => {
    expect.assertions(3)
    expect(validateImageUpload(fakeFile('image/png', 1000))).toBeNull()
    expect(validateImageUpload(fakeFile('image/jpeg', 1000))).toBeNull()
    expect(validateImageUpload(fakeFile('image/webp', 1000))).toBeNull()
  })

  it('rejects disallowed mime types', () => {
    expect.assertions(2)
    expect(validateImageUpload(fakeFile('image/gif', 1000))).toMatch(/PNG, JPEG, or WebP/)
    expect(validateImageUpload(fakeFile('application/pdf', 1000))).toMatch(/PNG, JPEG, or WebP/)
  })

  it('rejects files over the size limit', () => {
    expect.assertions(2)
    expect(validateImageUpload(fakeFile('image/png', MAX_IMAGE_BYTES + 1))).toMatch(/5 MB/)
    expect(validateImageUpload(fakeFile('image/png', MAX_IMAGE_BYTES))).toBeNull()
  })
})

describe('buildObjectPath', () => {
  it('builds a path scoped to the season with the kind and correct extension', () => {
    expect.assertions(4)
    const logoPath = buildObjectPath('season-1', 'logo', fakeFile('image/png', 100))
    expect(logoPath).toMatch(/^season-1\/logo-\d+\.png$/)

    const bannerPath = buildObjectPath('season-2', 'banner', fakeFile('image/jpeg', 100))
    expect(bannerPath).toMatch(/^season-2\/banner-\d+\.jpg$/)

    const webpPath = buildObjectPath('season-3', 'banner', fakeFile('image/webp', 100))
    expect(webpPath).toMatch(/^season-3\/banner-\d+\.webp$/)

    const unknownPath = buildObjectPath('season-4', 'logo', fakeFile('image/gif', 100))
    expect(unknownPath).toMatch(/^season-4\/logo-\d+\.bin$/)
  })
})

describe('objectPathFromPublicUrl', () => {
  it('extracts the in-bucket path from a public url', () => {
    expect.assertions(1)
    const url = `https://example.supabase.co/storage/v1/object/public/${SEASON_IMAGE_BUCKET}/season-1/logo-123.png`
    expect(objectPathFromPublicUrl(url)).toBe('season-1/logo-123.png')
  })

  it('returns null for urls not pointing at the bucket', () => {
    expect.assertions(2)
    expect(objectPathFromPublicUrl('https://example.com/other/thing.png')).toBeNull()
    expect(
      objectPathFromPublicUrl(
        `https://example.com/storage/v1/object/public/${SEASON_IMAGE_BUCKET}/`,
      ),
    ).toBeNull()
  })
})
