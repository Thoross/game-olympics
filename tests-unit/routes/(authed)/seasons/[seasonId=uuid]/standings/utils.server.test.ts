import { describe, it, expect } from 'vitest'
import { positionToPoints } from '$lib/server/utils.server'
import { buildStandings, type RawSession } from '$routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const alice = { player_id: 'p-alice', player_name: 'Alice' }
const bob = { player_id: 'p-bob', player_name: 'Bob' }
const carol = { player_id: 'p-carol', player_name: 'Carol' }

let _sessionCounter = 0

function makeSession(
  id: string,
  playerSessions: RawSession['player_sessions'],
  gameId?: string,
): RawSession {
  _sessionCounter++
  return {
    session_id: id,
    game_id: gameId ?? 'g-default',
    session_date_played: `2024-01-${String(_sessionCounter).padStart(2, '0')}`,
    player_sessions: playerSessions,
  }
}

function ps(
  player: { player_id: string; player_name: string },
  score: number,
  position: number,
) {
  return { player, player_session_score: score, player_session_position: position }
}

// ─── positionToPoints ────────────────────────────────────────────────────────

describe('positionToPoints', () => {
  it('awards 4 points for 1st', () => expect(positionToPoints(1)).toBe(4))
  it('awards 3 points for 2nd', () => expect(positionToPoints(2)).toBe(3))
  it('awards 2 points for 3rd', () => expect(positionToPoints(3)).toBe(2))
  it('awards 1 point for 4th', () => expect(positionToPoints(4)).toBe(1))
  it('awards 0 points for 5th', () => expect(positionToPoints(5)).toBe(0))
  it('awards 0 points for positions beyond 5th', () => {
    expect(positionToPoints(6)).toBe(0)
    expect(positionToPoints(10)).toBe(0)
  })
  it('awards 0 points for position 0', () => expect(positionToPoints(0)).toBe(0))
})

// ─── buildStandings ──────────────────────────────────────────────────────────

describe('buildStandings', () => {
  it('returns empty array for no sessions', () => {
    expect(buildStandings([], null)).toEqual([])
  })

  it('returns empty array when sessions have no player_sessions', () => {
    expect(buildStandings([makeSession('s-1', null)], null)).toEqual([])
  })

  it('counts a single game played by one player', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)])]
    const [standing] = buildStandings(sessions, null)
    expect(standing.player_id).toBe(alice.player_id)
    expect(standing.games_played).toBe(1)
    expect(standing.standings_points).toBe(4)
    expect(standing.avg_score).toBe(10)
    expect(standing.avg_position).toBe(1)
  })

  it('accumulates stats across multiple sessions for the same player', () => {
    const sessions = [
      makeSession('s-1', [ps(alice, 10, 1)]),
      makeSession('s-2', [ps(alice, 6, 3)]),
    ]
    const [standing] = buildStandings(sessions, null)
    expect(standing.games_played).toBe(2)
    expect(standing.standings_points).toBe(6) // 4 + 2
    expect(standing.avg_score).toBe(8) // (10 + 6) / 2
    expect(standing.avg_position).toBe(2) // (1 + 3) / 2
  })

  it('collects all players across sessions', () => {
    const sessions = [
      makeSession('s-1', [ps(alice, 10, 1), ps(bob, 8, 2)]),
      makeSession('s-2', [ps(carol, 9, 1)]),
    ]
    const result = buildStandings(sessions, null)
    expect(result).toHaveLength(3)
    expect(result.map((s) => s.player_id)).toEqual(
      expect.arrayContaining([alice.player_id, bob.player_id, carol.player_id]),
    )
  })

  it('sorts by standings_points descending', () => {
    const sessions = [
      makeSession('s-1', [
        ps(alice, 10, 1), // 4 pts
        ps(bob, 8, 2), // 3 pts
      ]),
    ]
    const result = buildStandings(sessions, null)
    expect(result[0].player_id).toBe(alice.player_id)
    expect(result[1].player_id).toBe(bob.player_id)
  })

  it('uses avg_score as tiebreaker when standings_points are equal', () => {
    // Both players win one game each → 4 pts each; alice has higher avg score
    const sessions = [
      makeSession('s-1', [ps(alice, 20, 1), ps(bob, 5, 2)]),
      makeSession('s-2', [ps(bob, 15, 1), ps(alice, 5, 2)]),
    ]
    const result = buildStandings(sessions, null)
    expect(result[0].player_id).toBe(alice.player_id) // avg_score 12.5 vs 10
    expect(result[1].player_id).toBe(bob.player_id)
  })

  it('handles player as array (Supabase join format)', () => {
    const sessions = [
      makeSession('s-1', [{ player: [alice], player_session_score: 10, player_session_position: 1 }]),
    ]
    const [standing] = buildStandings(sessions, null)
    expect(standing.player_id).toBe(alice.player_id)
  })

  it('skips player_sessions with null player', () => {
    const sessions = [
      makeSession('s-1', [{ player: null, player_session_score: 10, player_session_position: 1 }]),
    ]
    expect(buildStandings(sessions, null)).toEqual([])
  })

  it('does not expose _total_score on returned objects', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)])]
    const [standing] = buildStandings(sessions, null)
    expect('_total_score' in standing).toBe(false)
  })
})
