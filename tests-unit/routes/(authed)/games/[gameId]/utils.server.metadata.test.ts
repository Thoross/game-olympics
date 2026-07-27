import { describe, it, expect } from 'vitest'
import { buildGameFieldBreakdowns } from '$routes/(authed)/games/[gameId]/utils.server'

describe('buildGameFieldBreakdowns', () => {
  it('counts values per field, sorted by count then value', () => {
    const result = buildGameFieldBreakdowns([
      { field_name: 'Class', value: 'Brute' },
      { field_name: 'Class', value: 'Brute' },
      { field_name: 'Class', value: 'Tinkerer' },
      { field_name: 'Faction', value: 'Red' },
    ])

    expect(result).toEqual([
      {
        field_name: 'Class',
        values: [
          { value: 'Brute', count: 2 },
          { value: 'Tinkerer', count: 1 },
        ],
      },
      { field_name: 'Faction', values: [{ value: 'Red', count: 1 }] },
    ])
  })

  it('returns an empty array for no rows', () => {
    expect(buildGameFieldBreakdowns([])).toEqual([])
  })
})
