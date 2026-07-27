import { describe, it, expect } from 'vitest'
import { reconcilePlayerSessions } from '$routes/(authed)/admin/sessions/[sessionId]/edit/utils.server'

describe('reconcilePlayerSessions', () => {
  it('updates retained players, inserts new, deletes removed', () => {
    const existing = [
      { player_session_id: 'ps-a', player_id: 'A' },
      { player_session_id: 'ps-b', player_id: 'B' },
    ]
    const ranked = [
      { player_id: 'A', player_session_score: 10, player_session_position: 1 },
      { player_id: 'C', player_session_score: 5, player_session_position: 2 },
    ]

    const plan = reconcilePlayerSessions(existing, ranked)

    expect(plan.updates).toEqual([
      { player_session_id: 'ps-a', player_session_score: 10, player_session_position: 1 },
    ])
    expect(plan.inserts).toEqual([
      { player_id: 'C', player_session_score: 5, player_session_position: 2 },
    ])
    expect(plan.deleteIds).toEqual(['ps-b'])
  })

  it('handles an unchanged roster with no inserts or deletes', () => {
    const existing = [{ player_session_id: 'ps-a', player_id: 'A' }]
    const ranked = [{ player_id: 'A', player_session_score: 3, player_session_position: 1 }]
    const plan = reconcilePlayerSessions(existing, ranked)
    expect(plan.inserts).toEqual([])
    expect(plan.deleteIds).toEqual([])
    expect(plan.updates).toHaveLength(1)
  })
})
