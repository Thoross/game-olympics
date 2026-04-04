import { describe, it, expect } from 'vitest'
import { buildStandings } from '$routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server'
import {
  buildStandingsOverTime,
  buildPlayers,
} from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'
import type { NormalizedSession } from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PartialRawSession = {
  session_id: string
  game_id: string
  session_date_played: string
  player_sessions: Array<{
    player_session_score: number | null
    player_session_position: number | null
    player: { player_id: string; player_name: string }
  }>
}

function makeSession(
  id: string,
  gameId: string,
  datePlayed: string,
  participants: Array<{ id: string; name: string; score: number; position: number }>,
): PartialRawSession {
  return {
    session_id: id,
    game_id: gameId,
    session_date_played: datePlayed,
    player_sessions: participants.map((p) => ({
      player_session_score: p.score,
      player_session_position: p.position,
      player: { player_id: p.id, player_name: p.name },
    })),
  }
}

function makeNormalizedSession(
  id: string,
  gameId: string,
  gameName: string,
  date: string,
  participants: Array<{ id: string; name: string; score: number; position: number; points: number }>,
): NormalizedSession {
  return {
    session_id: id,
    session_date_played: date,
    game_id: gameId,
    game_name: gameName,
    player_sessions: participants.map((p) => ({
      player_id: p.id,
      player_name: p.name,
      score: p.score,
      position: p.position,
      standings_points: p.points,
    })),
  }
}

// ---------------------------------------------------------------------------
// buildStandings tests (standings pipeline with multipliers)
// ---------------------------------------------------------------------------

describe('buildStandings', () => {
  describe('multipliers [1, 2, 3]: same game played 3 times', () => {
    it('1st place player accumulates 4 + 8 + 12 = 24 standings_points', () => {
      expect.assertions(1)
      const sessions = [
        makeSession('s1', 'gameA', '2024-01-01', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s2', 'gameA', '2024-01-08', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s3', 'gameA', '2024-01-15', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
      ]
      const standings = buildStandings(sessions, [1, 2, 3])
      const alice = standings.find((s) => s.player_id === 'p1')
      expect(alice?.standings_points).toBe(24) // 4*1 + 4*2 + 4*3
    })
  })

  describe('multipliers [1, 2, 3]: game isolation — game B counter resets', () => {
    it('1st place in game B session 1 gets 4 * multiplier[0] = 4', () => {
      expect.assertions(1)
      const sessions = [
        makeSession('s1', 'gameA', '2024-01-01', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s2', 'gameA', '2024-01-08', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s3', 'gameA', '2024-01-15', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        // Game B's first play — counter should be 1, not 4
        makeSession('s4', 'gameB', '2024-01-22', [{ id: 'p1', name: 'Alice', score: 20, position: 1 }]),
      ]
      const standings = buildStandings(sessions, [1, 2, 3])
      const alice = standings.find((s) => s.player_id === 'p1')
      // gameA: 4+8+12=24, gameB play1: 4*1=4, total=28
      expect(alice?.standings_points).toBe(28)
    })
  })

  describe('multipliers [1, 2]: overflow — 3rd and 4th session use last multiplier', () => {
    it('sessions 3 and 4 use multiplier[1] = 2', () => {
      expect.assertions(1)
      const sessions = [
        makeSession('s1', 'gameA', '2024-01-01', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s2', 'gameA', '2024-01-08', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s3', 'gameA', '2024-01-15', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s4', 'gameA', '2024-01-22', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
      ]
      const standings = buildStandings(sessions, [1, 2])
      const alice = standings.find((s) => s.player_id === 'p1')
      // 4*1 + 4*2 + 4*2 + 4*2 = 4 + 8 + 8 + 8 = 28
      expect(alice?.standings_points).toBe(28)
    })
  })

  describe('null multipliers: legacy behaviour unchanged', () => {
    it('1st place across 3 sessions of the same game gets 4 + 4 + 4 = 12', () => {
      expect.assertions(1)
      const sessions = [
        makeSession('s1', 'gameA', '2024-01-01', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s2', 'gameA', '2024-01-08', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
        makeSession('s3', 'gameA', '2024-01-15', [{ id: 'p1', name: 'Alice', score: 10, position: 1 }]),
      ]
      const standings = buildStandings(sessions, null)
      const alice = standings.find((s) => s.player_id === 'p1')
      expect(alice?.standings_points).toBe(12) // 4 + 4 + 4 (multiplier=1 always)
    })
  })
})

// ---------------------------------------------------------------------------
// Stats pipeline tests (aggregation functions receive pre-multiplied points)
// ---------------------------------------------------------------------------

describe('stats pipeline: buildStandingsOverTime with multiplied inputs', () => {
  it('accumulates multiplied standings_points correctly', () => {
    expect.assertions(1)
    // Simulate what stats/+page.server.ts produces after applying multipliers:
    // game A, 3 sessions with multipliers [1, 2, 3]:
    // session 1 — Alice 1st: 4*1=4
    // session 2 — Alice 1st: 4*2=8
    // session 3 — Alice 1st: 4*3=12
    const sessions: NormalizedSession[] = [
      makeNormalizedSession('s1', 'gameA', 'Game A', '2024-01-01', [
        { id: 'p1', name: 'Alice', score: 10, position: 1, points: 4 },
      ]),
      makeNormalizedSession('s2', 'gameA', 'Game A', '2024-01-08', [
        { id: 'p1', name: 'Alice', score: 10, position: 1, points: 8 },
      ]),
      makeNormalizedSession('s3', 'gameA', 'Game A', '2024-01-15', [
        { id: 'p1', name: 'Alice', score: 10, position: 1, points: 12 },
      ]),
    ]
    const players = buildPlayers(sessions)
    const overTime = buildStandingsOverTime(sessions, players)
    // After 3 sessions, cumulative total should be 4+8+12=24
    const lastSnapshot = overTime[overTime.length - 1]
    expect(lastSnapshot['p1']).toBe(24)
  })

  it('null multipliers (legacy): standings_points are base values (4/3/2/1)', () => {
    expect.assertions(1)
    // Simulate what stats/+page.server.ts produces with no schedule (multipliers=null → all multiplier=1)
    const sessions: NormalizedSession[] = [
      makeNormalizedSession('s1', 'gameA', 'Game A', '2024-01-01', [
        { id: 'p1', name: 'Alice', score: 10, position: 1, points: 4 },
        { id: 'p2', name: 'Bob', score: 8, position: 2, points: 3 },
      ]),
    ]
    const players = buildPlayers(sessions)
    const overTime = buildStandingsOverTime(sessions, players)
    const snapshot = overTime[0]
    expect(snapshot['p1']).toBe(4)
  })
})
