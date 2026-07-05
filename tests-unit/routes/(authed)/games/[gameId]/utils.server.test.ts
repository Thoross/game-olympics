import { describe, it, expect } from 'vitest'
import {
  buildPlayerGameSeasonStats,
  type GameSessionRow,
} from '$routes/(authed)/games/[gameId]/utils.server'

const P = 'player-1'

function session(
  season_id: string,
  season_name: string,
  date: string,
  players: Array<[string | null, number, number]>,
): GameSessionRow {
  return {
    season_id,
    season_name,
    session_date_played: date,
    player_sessions: players.map(([player_id, score, position]) => ({
      player_id,
      score,
      position,
    })),
  }
}

describe('buildPlayerGameSeasonStats', () => {
  it('aggregates a single season with the default (no-schedule) multiplier', () => {
    const sessions: GameSessionRow[] = [
      session('s1', 'Season 1', '2026-01-01', [
        [P, 10, 1],
        ['other', 8, 2],
      ]),
      session('s1', 'Season 1', '2026-02-01', [
        [P, 6, 2],
        ['other', 9, 1],
      ]),
    ]
    const result = buildPlayerGameSeasonStats(sessions, new Map([['s1', null]]), P)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      season_id: 's1',
      season_name: 'Season 1',
      times_played: 2,
      avg_score: 8, // (10 + 6) / 2
      avg_position: 1.5, // (1 + 2) / 2
      total_standings_points: 7, // 4 (1st) + 3 (2nd), multiplier 1
    })
  })

  it('applies the season multiplier schedule to standings points', () => {
    // Schedule: 1st play x1, 2nd play x2, 3rd+ x3
    const sessions: GameSessionRow[] = [
      session('s1', 'Season 1', '2026-01-01', [[P, 10, 1]]), // play 1, x1 -> 4
      session('s1', 'Season 1', '2026-02-01', [[P, 10, 1]]), // play 2, x2 -> 8
      session('s1', 'Season 1', '2026-03-01', [[P, 10, 2]]), // play 3, x3 -> 9
    ]
    const result = buildPlayerGameSeasonStats(sessions, new Map([['s1', [1, 2, 3]]]), P)
    expect(result[0].total_standings_points).toBe(4 + 8 + 9)
  })

  it('increments the multiplier play-count even for sessions the player skipped', () => {
    const sessions: GameSessionRow[] = [
      session('s1', 'Season 1', '2026-01-01', [['other', 5, 1]]), // play 1, x1, player absent
      session('s1', 'Season 1', '2026-02-01', [[P, 10, 1]]), // play 2, x2 -> 4 * 2 = 8
    ]
    const result = buildPlayerGameSeasonStats(sessions, new Map([['s1', [1, 2]]]), P)
    expect(result[0].times_played).toBe(1)
    expect(result[0].total_standings_points).toBe(8)
  })

  it('returns one entry per season, most-recently-played first', () => {
    const sessions: GameSessionRow[] = [
      session('s1', 'Season 1', '2026-01-01', [[P, 10, 1]]),
      session('s2', 'Season 2', '2026-06-01', [[P, 7, 3]]),
    ]
    const result = buildPlayerGameSeasonStats(
      sessions,
      new Map([
        ['s1', null],
        ['s2', null],
      ]),
      P,
    )
    expect(result.map((r) => r.season_id)).toEqual(['s2', 's1'])
  })

  it('returns an empty array when the player never played the game', () => {
    const sessions: GameSessionRow[] = [session('s1', 'Season 1', '2026-01-01', [['other', 5, 1]])]
    const result = buildPlayerGameSeasonStats(sessions, new Map([['s1', null]]), P)
    expect(result).toEqual([])
  })

  it('returns an empty array for no sessions', () => {
    expect(buildPlayerGameSeasonStats([], new Map(), P)).toEqual([])
  })
})
