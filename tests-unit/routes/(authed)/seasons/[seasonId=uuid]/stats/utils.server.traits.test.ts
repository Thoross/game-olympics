import { describe, it, expect } from 'vitest'
import { buildGameTraitBreakdowns } from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'

describe('buildGameTraitBreakdowns', () => {
  it('groups by game+trait+value with outings and avg score', () => {
    const result = buildGameTraitBreakdowns([
      {
        game_id: 'g1',
        game_name: 'Gloomhaven',
        player_sessions: [
          { score: 10, traits: [{ trait_name: 'Class', trait_value: 'Brute' }] },
          { score: 20, traits: [{ trait_name: 'Class', trait_value: 'Brute' }] },
          { score: 5, traits: [{ trait_name: 'Class', trait_value: 'Tinkerer' }] },
        ],
      },
    ])

    expect(result).toEqual([
      {
        game_id: 'g1',
        game_name: 'Gloomhaven',
        trait_name: 'Class',
        rows: [
          { trait_value: 'Brute', outings: 2, avg_score: 15 },
          { trait_value: 'Tinkerer', outings: 1, avg_score: 5 },
        ],
      },
    ])
  })

  it('counts two players on one trait value in the same session as two outings', () => {
    const result = buildGameTraitBreakdowns([
      {
        game_id: 'g1',
        game_name: 'Gloomhaven',
        player_sessions: [
          { score: 10, traits: [{ trait_name: 'Class', trait_value: 'Brute' }] },
          { score: 30, traits: [{ trait_name: 'Class', trait_value: 'Brute' }] },
        ],
      },
    ])

    expect(result[0].rows).toEqual([{ trait_value: 'Brute', outings: 2, avg_score: 20 }])
  })

  it('returns an empty array when no player-session carries traits', () => {
    expect(
      buildGameTraitBreakdowns([
        { game_id: 'g1', game_name: 'x', player_sessions: [{ score: 1, traits: [] }] },
      ]),
    ).toEqual([])
  })
})
