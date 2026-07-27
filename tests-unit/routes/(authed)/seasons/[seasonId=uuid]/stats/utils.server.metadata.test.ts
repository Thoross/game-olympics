import { describe, it, expect } from 'vitest'
import { buildMetadataBreakdowns } from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'

describe('buildMetadataBreakdowns', () => {
  it('groups by game+field+value with play count and avg score', () => {
    const result = buildMetadataBreakdowns([
      {
        game_id: 'g1',
        game_name: 'Gloomhaven',
        player_sessions: [
          { score: 10, metadata: [{ field_name: 'Class', value: 'Brute' }] },
          { score: 20, metadata: [{ field_name: 'Class', value: 'Brute' }] },
          { score: 5, metadata: [{ field_name: 'Class', value: 'Tinkerer' }] },
        ],
      },
    ])

    expect(result).toEqual([
      {
        game_id: 'g1',
        game_name: 'Gloomhaven',
        field_name: 'Class',
        rows: [
          { value: 'Brute', play_count: 2, avg_score: 15 },
          { value: 'Tinkerer', play_count: 1, avg_score: 5 },
        ],
      },
    ])
  })

  it('returns an empty array when no player-session carries metadata', () => {
    expect(
      buildMetadataBreakdowns([
        { game_id: 'g1', game_name: 'x', player_sessions: [{ score: 1, metadata: [] }] },
      ]),
    ).toEqual([])
  })
})
