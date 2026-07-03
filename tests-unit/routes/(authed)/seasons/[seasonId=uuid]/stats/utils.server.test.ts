import { describe, it, expect } from 'vitest'
import { positionToPoints } from '$lib/server/utils.server'
import {
  buildGameStats,
  buildPlayers,
  buildSessionBreakdowns,
  buildStandingsOverTime,
  buildScoresByGame,
  buildSeasonAverages,
  buildGameAverages,
  type NormalizedSession,
} from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const alice = { player_id: 'p-alice', player_name: 'Alice' }
const bob = { player_id: 'p-bob', player_name: 'Bob' }
const carol = { player_id: 'p-carol', player_name: 'Carol' }

function makeSession(
  overrides: Partial<NormalizedSession> & { player_sessions: NormalizedSession['player_sessions'] },
): NormalizedSession {
  return {
    session_id: 's-1',
    session_date_played: '2024-03-01T00:00:00Z',
    game_id: 'g-catan',
    game_name: 'Catan',
    ...overrides,
  }
}

// ─── positionToPoints ─────────────────────────────────────────────────────────

describe('positionToPoints', () => {
  it('awards 4 points for 1st', () => {
    expect(positionToPoints(1)).toBe(4)
  })

  it('awards 3 points for 2nd', () => {
    expect(positionToPoints(2)).toBe(3)
  })

  it('awards 2 points for 3rd', () => {
    expect(positionToPoints(3)).toBe(2)
  })

  it('awards 1 point for 4th', () => {
    expect(positionToPoints(4)).toBe(1)
  })

  it('awards 0 points for 5th', () => {
    expect(positionToPoints(5)).toBe(0)
  })

  it('awards 0 points for positions beyond 5th', () => {
    expect(positionToPoints(6)).toBe(0)
    expect(positionToPoints(10)).toBe(0)
  })

  it('awards 0 points for position 0', () => {
    expect(positionToPoints(0)).toBe(0)
  })
})

// ─── buildGameStats ───────────────────────────────────────────────────────────

describe('buildGameStats', () => {
  it('counts a single game played once', () => {
    const sessions = [makeSession({ player_sessions: [] })]
    const result = buildGameStats(sessions)
    expect(result).toEqual([{ game_id: 'g-catan', game_name: 'Catan', times_played: 1 }])
  })

  it('counts the same game played multiple times', () => {
    const sessions = [
      makeSession({ session_id: 's-1', player_sessions: [] }),
      makeSession({ session_id: 's-2', player_sessions: [] }),
      makeSession({ session_id: 's-3', player_sessions: [] }),
    ]
    const result = buildGameStats(sessions)
    expect(result[0].times_played).toBe(3)
  })

  it('counts multiple distinct games', () => {
    const sessions = [
      makeSession({ session_id: 's-1', player_sessions: [] }),
      makeSession({
        session_id: 's-2',
        game_id: 'g-chess',
        game_name: 'Chess',
        player_sessions: [],
      }),
    ]
    const result = buildGameStats(sessions)
    expect(result).toHaveLength(2)
  })

  it('sorts games by times_played descending', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        game_id: 'g-chess',
        game_name: 'Chess',
        player_sessions: [],
      }),
      makeSession({ session_id: 's-2', player_sessions: [] }),
      makeSession({ session_id: 's-3', player_sessions: [] }),
    ]
    const result = buildGameStats(sessions)
    expect(result[0].game_name).toBe('Catan')
    expect(result[1].game_name).toBe('Chess')
  })

  it('returns empty array for no sessions', () => {
    expect(buildGameStats([])).toEqual([])
  })
})

// ─── buildPlayers ─────────────────────────────────────────────────────────────

describe('buildPlayers', () => {
  it('collects unique players across sessions', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...bob, score: 8, position: 2, standings_points: 3 },
        ],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [
          { ...alice, score: 7, position: 2, standings_points: 3 },
          { ...carol, score: 9, position: 1, standings_points: 4 },
        ],
      }),
    ]
    const result = buildPlayers(sessions)
    expect(result.map((p) => p.player_id)).toEqual(
      expect.arrayContaining([alice.player_id, bob.player_id, carol.player_id]),
    )
    expect(result).toHaveLength(3)
  })

  it('deduplicates players appearing in multiple sessions', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [{ ...alice, score: 8, position: 1, standings_points: 4 }],
      }),
    ]
    expect(buildPlayers(sessions)).toHaveLength(1)
  })

  it('returns empty array for no sessions', () => {
    expect(buildPlayers([])).toEqual([])
  })
})

// ─── buildSessionBreakdowns ───────────────────────────────────────────────────

describe('buildSessionBreakdowns', () => {
  it('sorts players by position ascending', () => {
    const sessions = [
      makeSession({
        player_sessions: [
          { ...bob, score: 8, position: 2, standings_points: 3 },
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...carol, score: 6, position: 3, standings_points: 2 },
        ],
      }),
    ]
    const [breakdown] = buildSessionBreakdowns(sessions)
    expect(breakdown.players.map((p) => p.player_name)).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it('includes game name and session id', () => {
    const sessions = [makeSession({ player_sessions: [] })]
    const [breakdown] = buildSessionBreakdowns(sessions)
    expect(breakdown.game_name).toBe('Catan')
    expect(breakdown.session_id).toBe('s-1')
  })

  it('formats the date in en-US locale', () => {
    const sessions = [
      makeSession({ session_date_played: '2024-03-15T12:00:00Z', player_sessions: [] }),
    ]
    const [breakdown] = buildSessionBreakdowns(sessions)
    expect(breakdown.date).toBe('Mar 15, 2024')
  })
})

// ─── buildStandingsOverTime ───────────────────────────────────────────────────

describe('buildStandingsOverTime', () => {
  it('produces one snapshot per session', () => {
    const players = [alice, bob]
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...bob, score: 8, position: 2, standings_points: 3 },
        ],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [
          { ...alice, score: 7, position: 2, standings_points: 3 },
          { ...bob, score: 9, position: 1, standings_points: 4 },
        ],
      }),
    ]
    expect(buildStandingsOverTime(sessions, players)).toHaveLength(2)
  })

  it('accumulates points correctly across sessions', () => {
    const players = [alice, bob]
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...bob, score: 8, position: 2, standings_points: 3 },
        ],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [
          { ...alice, score: 7, position: 2, standings_points: 3 },
          { ...bob, score: 9, position: 1, standings_points: 4 },
        ],
      }),
    ]
    const [snap1, snap2] = buildStandingsOverTime(sessions, players)
    expect(snap1[alice.player_id]).toBe(4)
    expect(snap1[bob.player_id]).toBe(3)
    expect(snap2[alice.player_id]).toBe(7)
    expect(snap2[bob.player_id]).toBe(7)
  })

  it('labels snapshots as "Session #N"', () => {
    const players = [alice]
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [{ ...alice, score: 8, position: 1, standings_points: 4 }],
      }),
    ]
    const snapshots = buildStandingsOverTime(sessions, players)
    expect(snapshots[0].label).toBe('Session #1')
    expect(snapshots[1].label).toBe('Session #2')
  })

  it('initialises all players to 0 before their first session', () => {
    const players = [alice, bob]
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
    ]
    const [snap] = buildStandingsOverTime(sessions, players)
    expect(snap[bob.player_id]).toBe(0)
  })

  it('returns empty array for no sessions', () => {
    expect(buildStandingsOverTime([], [alice])).toEqual([])
  })
})

// ─── buildScoresByGame ────────────────────────────────────────────────────────

describe('buildScoresByGame', () => {
  it('groups sessions by game', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        game_id: 'g-chess',
        game_name: 'Chess',
        player_sessions: [{ ...alice, score: 5, position: 1, standings_points: 4 }],
      }),
    ]
    const result = buildScoresByGame(sessions)
    expect(result).toHaveLength(2)
    expect(result.map((g) => g.game_name)).toEqual(expect.arrayContaining(['Catan', 'Chess']))
  })

  it('labels plays sequentially within a game', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [{ ...alice, score: 8, position: 1, standings_points: 4 }],
      }),
    ]
    const [game] = buildScoresByGame(sessions)
    expect(game.sessions[0].label).toBe('Session #1')
    expect(game.sessions[1].label).toBe('Session #2')
  })

  it('records per-player scores in each play', () => {
    const sessions = [
      makeSession({
        player_sessions: [
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...bob, score: 7, position: 2, standings_points: 3 },
        ],
      }),
    ]
    const [game] = buildScoresByGame(sessions)
    expect(game.sessions[0][alice.player_id]).toBe(10)
    expect(game.sessions[0][bob.player_id]).toBe(7)
  })

  it('collects all playerIds across multiple plays of the same game', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        player_sessions: [{ ...bob, score: 8, position: 1, standings_points: 4 }],
      }),
    ]
    const [game] = buildScoresByGame(sessions)
    expect(game.playerIds).toEqual(expect.arrayContaining([alice.player_id, bob.player_id]))
  })

  it('returns empty array for no sessions', () => {
    expect(buildScoresByGame([])).toEqual([])
  })
})

// ─── buildSeasonAverages ──────────────────────────────────────────────────────

describe('buildSeasonAverages', () => {
  it('returns empty array for no sessions', () => {
    expect(buildSeasonAverages([])).toEqual([])
  })

  it('averages a player across all their sessions', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        game_id: 'g-catan',
        player_sessions: [{ ...alice, score: 10, position: 1, standings_points: 4 }],
      }),
      makeSession({
        session_id: 's-2',
        game_id: 'g-ticket',
        player_sessions: [{ ...alice, score: 6, position: 3, standings_points: 2 }],
      }),
    ]
    const [row] = buildSeasonAverages(sessions)
    expect(row.player_id).toBe(alice.player_id)
    expect(row.avg_score).toBe(8) // (10 + 6) / 2
    expect(row.avg_position).toBe(2) // (1 + 3) / 2
  })

  it('handles single-session players', () => {
    const sessions = [
      makeSession({ player_sessions: [{ ...bob, score: 5, position: 2, standings_points: 3 }] }),
    ]
    const [row] = buildSeasonAverages(sessions)
    expect(row.avg_score).toBe(5)
    expect(row.avg_position).toBe(2)
  })

  it('sorts by avg_score desc, tiebreak avg_position asc', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        player_sessions: [
          { ...alice, score: 10, position: 2, standings_points: 3 },
          { ...bob, score: 10, position: 1, standings_points: 4 },
          { ...carol, score: 5, position: 3, standings_points: 2 },
        ],
      }),
    ]
    const result = buildSeasonAverages(sessions)
    // Alice & Bob tie on avg_score 10 → Bob first (lower avg_position); Carol last
    expect(result.map((r) => r.player_id)).toEqual([
      bob.player_id,
      alice.player_id,
      carol.player_id,
    ])
  })
})

// ─── buildGameAverages ────────────────────────────────────────────────────────

describe('buildGameAverages', () => {
  it('returns empty array for no sessions', () => {
    expect(buildGameAverages([])).toEqual([])
  })

  it('computes per-game averages and total score, only for players who played that game', () => {
    const sessions = [
      makeSession({
        session_id: 's-1',
        game_id: 'g-catan',
        game_name: 'Catan',
        player_sessions: [
          { ...alice, score: 10, position: 1, standings_points: 4 },
          { ...bob, score: 8, position: 2, standings_points: 3 },
        ],
      }),
      makeSession({
        session_id: 's-2',
        game_id: 'g-catan',
        game_name: 'Catan',
        player_sessions: [{ ...alice, score: 4, position: 2, standings_points: 3 }],
      }),
      makeSession({
        session_id: 's-3',
        game_id: 'g-ticket',
        game_name: 'Ticket to Ride',
        player_sessions: [{ ...carol, score: 20, position: 1, standings_points: 4 }],
      }),
    ]
    const result = buildGameAverages(sessions)
    // Catan played twice → first (most-played order)
    expect(result[0].game_id).toBe('g-catan')
    expect(result[1].game_id).toBe('g-ticket')

    const catanAlice = result[0].rows.find((r) => r.player_id === alice.player_id)!
    expect(catanAlice.avg_score).toBe(7) // (10 + 4) / 2
    expect(catanAlice.avg_position).toBe(1.5) // (1 + 2) / 2
    expect(catanAlice.total_score).toBe(14) // 10 + 4

    // Bob only played Catan once; Carol never played Catan
    expect(result[0].rows.map((r) => r.player_id)).not.toContain(carol.player_id)
    expect(result[1].rows.map((r) => r.player_id)).toEqual([carol.player_id])
  })

  it('sorts rows within a game by avg_score desc', () => {
    const sessions = [
      makeSession({
        game_id: 'g-catan',
        player_sessions: [
          { ...alice, score: 5, position: 2, standings_points: 3 },
          { ...bob, score: 12, position: 1, standings_points: 4 },
        ],
      }),
    ]
    const [game] = buildGameAverages(sessions)
    expect(game.rows.map((r) => r.player_id)).toEqual([bob.player_id, alice.player_id])
  })
})
