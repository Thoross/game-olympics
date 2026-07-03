import { describe, it, expect } from 'vitest'
import {
  buildGamesPlayed,
  type GamePlayedSession,
} from '$routes/(authed)/seasons/[seasonId=uuid]/games/utils.server'

function makeSession(overrides: Partial<GamePlayedSession>): GamePlayedSession {
  return {
    game_id: 'g-catan',
    game_name: 'Catan',
    session_date_played: '2026-07-01',
    ...overrides,
  }
}

describe('buildGamesPlayed', () => {
  it('returns empty array for no sessions', () => {
    expect(buildGamesPlayed([], new Map())).toEqual([])
  })

  it('shows a single date (no range) for a game played once', () => {
    const [row] = buildGamesPlayed([makeSession({ session_date_played: '2026-07-01' })], new Map())
    expect(row.dates).toBe('Jul 1, 2026')
  })

  it('shows a date range for a game played multiple times, with a single chooser', () => {
    const rows = buildGamesPlayed(
      [
        makeSession({ session_date_played: '2026-07-01' }),
        makeSession({ session_date_played: '2026-07-24' }),
      ],
      new Map([['g-catan', 'Alice']]),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].dates).toBe('Jul 1 – Jul 24, 2026')
    expect(rows[0].chosen_by).toBe('Alice')
  })

  it('computes the range from min/max regardless of input order', () => {
    const [row] = buildGamesPlayed(
      [
        makeSession({ session_date_played: '2026-07-24' }),
        makeSession({ session_date_played: '2026-07-01' }),
        makeSession({ session_date_played: '2026-07-10' }),
      ],
      new Map(),
    )
    expect(row.dates).toBe('Jul 1 – Jul 24, 2026')
  })

  it('sets chosen_by to null when the game has no chooser entry', () => {
    const [row] = buildGamesPlayed([makeSession({})], new Map())
    expect(row.chosen_by).toBeNull()
  })

  it('sets chosen_by to null when the map holds an explicit null', () => {
    const [row] = buildGamesPlayed([makeSession({})], new Map([['g-catan', null]]))
    expect(row.chosen_by).toBeNull()
  })

  it('produces one row per game, ordered by earliest date ascending', () => {
    const rows = buildGamesPlayed(
      [
        makeSession({
          game_id: 'g-ticket',
          game_name: 'Ticket',
          session_date_played: '2026-07-05',
        }),
        makeSession({ game_id: 'g-catan', game_name: 'Catan', session_date_played: '2026-07-01' }),
      ],
      new Map([
        ['g-ticket', 'Bob'],
        ['g-catan', 'Alice'],
      ]),
    )
    expect(rows.map((r) => r.game_id)).toEqual(['g-catan', 'g-ticket'])
    expect(rows.map((r) => r.chosen_by)).toEqual(['Alice', 'Bob'])
  })
})
