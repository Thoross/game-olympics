import { describe, it, expect } from 'vitest'
import { buildTraitBreakdowns } from '$routes/(authed)/games/[gameId]/utils.server'

describe('buildTraitBreakdowns', () => {
  it('counts outings per trait value, sorted by outings then value', () => {
    const result = buildTraitBreakdowns([
      { trait_name: 'Class', trait_value: 'Brute' },
      { trait_name: 'Class', trait_value: 'Brute' },
      { trait_name: 'Class', trait_value: 'Tinkerer' },
      { trait_name: 'Faction', trait_value: 'Red' },
    ])

    expect(result).toEqual([
      {
        trait_name: 'Class',
        values: [
          { trait_value: 'Brute', outings: 2 },
          { trait_value: 'Tinkerer', outings: 1 },
        ],
      },
      { trait_name: 'Faction', values: [{ trait_value: 'Red', outings: 1 }] },
    ])
  })

  it('returns an empty array for no rows', () => {
    expect(buildTraitBreakdowns([])).toEqual([])
  })
})
