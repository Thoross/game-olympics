import { describe, it, expect } from 'vitest'
import { positionToPoints } from '$lib/server/utils.server'
import {
  buildStandings,
  countGamesChosen,
  type RawSession,
} from '$routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server'

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

function ps(player: { player_id: string; player_name: string }, score: number, position: number) {
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
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)]), makeSession('s-2', [ps(alice, 6, 3)])]
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
      makeSession('s-1', [
        { player: [alice], player_session_score: 10, player_session_position: 1 },
      ]),
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

  it('does not expose _positions on returned objects', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)])]
    const [standing] = buildStandings(sessions, null)
    expect('_positions' in standing).toBe(false)
  })

  it('defaults date_paid to null (merged in by the load, not here)', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)])]
    const [standing] = buildStandings(sessions, null)
    expect(standing.date_paid).toBeNull()
  })
})

// ─── games_chosen (defaulted in buildStandings, merged by the load) ────────────

describe('buildStandings games_chosen', () => {
  it('defaults games_chosen to 0 (merged in by the load, not here)', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1), ps(bob, 8, 2)])]
    const result = buildStandings(sessions, null)
    expect(result.every((s) => s.games_chosen === 0)).toBe(true)
  })
})

// ─── countGamesChosen ──────────────────────────────────────────────────────────

describe('countGamesChosen', () => {
  it('counts rows per chooser', () => {
    const counts = countGamesChosen([
      { chosen_by: alice.player_id },
      { chosen_by: alice.player_id },
      { chosen_by: bob.player_id },
    ])
    expect(counts.get(alice.player_id)).toBe(2)
    expect(counts.get(bob.player_id)).toBe(1)
  })

  it('ignores rows with a null chooser', () => {
    const counts = countGamesChosen([{ chosen_by: null }, { chosen_by: alice.player_id }])
    expect(counts.get(alice.player_id)).toBe(1)
    expect(counts.has('null')).toBe(false)
    expect(counts.size).toBe(1)
  })

  it('returns an empty map for empty input', () => {
    expect(countGamesChosen([]).size).toBe(0)
  })

  it('counts multiple distinct games chosen by the same player', () => {
    const counts = countGamesChosen([
      { chosen_by: alice.player_id },
      { chosen_by: alice.player_id },
      { chosen_by: alice.player_id },
    ])
    expect(counts.get(alice.player_id)).toBe(3)
  })
})

// ─── last_positions ──────────────────────────────────────────────────────────

describe('buildStandings last_positions', () => {
  it('returns fewer than 4 for players with few sessions, newest-first', () => {
    const sessions = [makeSession('s-1', [ps(alice, 10, 1)]), makeSession('s-2', [ps(alice, 6, 3)])]
    const [standing] = buildStandings(sessions, null)
    expect(standing.last_positions).toEqual([3, 1]) // newest first
  })

  it('returns exactly the last 4 for players with more than 4 sessions, newest-first', () => {
    const sessions = [
      makeSession('s-1', [ps(alice, 1, 1)]),
      makeSession('s-2', [ps(alice, 1, 2)]),
      makeSession('s-3', [ps(alice, 1, 3)]),
      makeSession('s-4', [ps(alice, 1, 4)]),
      makeSession('s-5', [ps(alice, 1, 2)]),
      makeSession('s-6', [ps(alice, 1, 1)]),
    ]
    const [standing] = buildStandings(sessions, null)
    expect(standing.last_positions).toEqual([1, 2, 4, 3]) // s6,s5,s4,s3 newest-first
  })

  it('preserves a 0/unknown position in the slot (view renders it as a dash)', () => {
    const sessions = [
      makeSession('s-1', [
        { player: alice, player_session_score: 5, player_session_position: null },
      ]),
      makeSession('s-2', [ps(alice, 6, 1)]),
    ]
    const [standing] = buildStandings(sessions, null)
    expect(standing.last_positions).toEqual([1, 0]) // newest 1st, older 0 (unknown)
  })
})
