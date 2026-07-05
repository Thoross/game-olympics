/**
 * BoardGameGeek (BGG) XML API v2 integration.
 *
 * `extractBggId` and `parseBggThing` are pure and unit-tested. `fetchBggGame`
 * performs the network call and never throws — on any failure it returns null so
 * callers (add-game, refresh) can degrade gracefully and leave metadata unset.
 */

export type BggGameData = {
  bggId: number
  imageUrl: string | null
  description: string | null
  yearPublished: number | null
  rating: number | null
}

const BGG_THING_URL = 'https://boardgamegeek.com/xmlapi2/thing'

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  trade: '™',
  copy: '©',
  reg: '®',
}

/** Decode the HTML entities BGG uses in descriptions (named + numeric decimal/hex). */
function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X'
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)
      if (Number.isNaN(code)) return match
      return String.fromCodePoint(code)
    }
    const named = NAMED_ENTITIES[entity]
    return named ?? match
  })
}

/**
 * Extract the numeric BGG id from a BoardGameGeek URL such as
 * `https://boardgamegeek.com/boardgame/13/catan`. Handles boardgame,
 * boardgameexpansion, and boardgameaccessory paths. Returns null when no id
 * is present (missing/blank URL, or a URL without a game path).
 */
export function extractBggId(url: string | null | undefined): number | null {
  if (!url) return null
  const match = url.match(/boardgame[a-z]*\/(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

/** Parse a BGG XML API v2 `thing` response for the fields we store. */
export function parseBggThing(xml: string): Omit<BggGameData, 'bggId'> | null {
  if (!xml) return null

  const imageMatch = xml.match(/<image>([\s\S]*?)<\/image>/)
  const yearMatch = xml.match(/<yearpublished value="([^"]*)"/)
  const descMatch = xml.match(/<description>([\s\S]*?)<\/description>/)
  // `<` boundary keeps this from matching `<bayesaverage value=...>`.
  const ratingMatch = xml.match(/<average value="([^"]*)"/)

  const year = yearMatch ? Number(yearMatch[1]) : NaN
  const rating = ratingMatch ? Number(ratingMatch[1]) : NaN

  const description = descMatch ? decodeEntities(descMatch[1]).trim() : null

  return {
    imageUrl: imageMatch ? imageMatch[1].trim() : null,
    description: description || null,
    yearPublished: Number.isFinite(year) ? year : null,
    rating: Number.isFinite(rating) ? rating : null,
  }
}

/**
 * Fetch a game's metadata from the BGG XML API. Never throws — returns null on
 * network error, non-OK response, or unparseable body.
 */
export async function fetchBggGame(bggId: number): Promise<BggGameData | null> {
  try {
    const res = await fetch(`${BGG_THING_URL}?id=${bggId}&stats=1`)
    if (!res.ok) return null
    const xml = await res.text()
    const parsed = parseBggThing(xml)
    if (!parsed) return null
    return { bggId, ...parsed }
  } catch {
    return null
  }
}
