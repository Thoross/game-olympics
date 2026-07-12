import { describe, it, expect } from 'vitest'
import { bggAuthHeaders, extractBggId, parseBggThing } from '$lib/server/bgg.server'

describe('bggAuthHeaders', () => {
  it('returns a Bearer Authorization header when a token is present', () => {
    expect(bggAuthHeaders('abc123')).toEqual({ Authorization: 'Bearer abc123' })
  })

  it('returns no header when the token is undefined, empty, or whitespace', () => {
    expect(bggAuthHeaders(undefined)).toEqual({})
    expect(bggAuthHeaders('')).toEqual({})
    expect(bggAuthHeaders('   ')).toEqual({})
  })
})

describe('extractBggId', () => {
  it('extracts the id from a standard boardgame URL', () => {
    expect(extractBggId('https://boardgamegeek.com/boardgame/13/catan')).toBe(13)
  })

  it('extracts the id from an expansion URL', () => {
    expect(extractBggId('https://boardgamegeek.com/boardgameexpansion/926/catan-seafarers')).toBe(
      926,
    )
  })

  it('extracts the id when a query string is present', () => {
    expect(extractBggId('https://boardgamegeek.com/boardgame/174430/gloomhaven?foo=bar')).toBe(
      174430,
    )
  })

  it('returns null for a URL without a game path', () => {
    expect(extractBggId('https://boardgamegeek.com/browse/boardgame')).toBeNull()
  })

  it('returns null for null/blank input', () => {
    expect(extractBggId(null)).toBeNull()
    expect(extractBggId(undefined)).toBeNull()
    expect(extractBggId('')).toBeNull()
  })
})

describe('parseBggThing', () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<items>
  <item type="boardgame" id="13">
    <thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail>
    <image>https://cf.geekdo-images.com/original.jpg</image>
    <name type="primary" sortindex="1" value="CATAN"/>
    <name type="alternate" sortindex="1" value="Die Siedler"/>
    <description>Trade &amp; build &#10;across the island of Catan&#39;s hexes.</description>
    <yearpublished value="1995"/>
    <statistics page="1">
      <ratings>
        <usersrated value="123456"/>
        <average value="7.06682"/>
        <bayesaverage value="6.89"/>
      </ratings>
    </statistics>
  </item>
</items>`

  it('parses image, year, rating and a decoded description', () => {
    const result = parseBggThing(xml)
    expect(result).not.toBeNull()
    expect(result?.imageUrl).toBe('https://cf.geekdo-images.com/original.jpg')
    expect(result?.yearPublished).toBe(1995)
    expect(result?.rating).toBeCloseTo(7.06682)
    expect(result?.description).toBe("Trade & build \nacross the island of Catan's hexes.")
  })

  it('picks the ratings average, not the bayesaverage', () => {
    const result = parseBggThing(xml)
    expect(result?.rating).not.toBe(6.89)
  })

  it('returns null fields for a response missing those elements', () => {
    const bare = `<items><item type="boardgame" id="99"></item></items>`
    const result = parseBggThing(bare)
    expect(result).toEqual({
      imageUrl: null,
      description: null,
      yearPublished: null,
      rating: null,
    })
  })

  it('returns null for empty input', () => {
    expect(parseBggThing('')).toBeNull()
  })
})
