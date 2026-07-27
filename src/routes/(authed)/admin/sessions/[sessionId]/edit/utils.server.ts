import type { RankedPlayer } from '../../add/utils.server'

export type ExistingPlayerSession = { player_session_id: string; player_id: string }

export type ReconcilePlan = {
  updates: {
    player_session_id: string
    player_session_score: number
    player_session_position: number
  }[]
  inserts: {
    player_id: string
    player_session_score: number
    player_session_position: number
  }[]
  deleteIds: string[]
}

export function reconcilePlayerSessions(
  existing: ExistingPlayerSession[],
  ranked: RankedPlayer[],
): ReconcilePlan {
  const idByPlayer = new Map(existing.map((e) => [e.player_id, e.player_session_id]))
  const rankedIds = new Set(ranked.map((r) => r.player_id))

  const updates: ReconcilePlan['updates'] = []
  const inserts: ReconcilePlan['inserts'] = []

  for (const r of ranked) {
    const player_session_id = idByPlayer.get(r.player_id)
    if (player_session_id) {
      updates.push({
        player_session_id,
        player_session_score: r.player_session_score,
        player_session_position: r.player_session_position,
      })
    } else {
      inserts.push({
        player_id: r.player_id,
        player_session_score: r.player_session_score,
        player_session_position: r.player_session_position,
      })
    }
  }

  const deleteIds = existing
    .filter((e) => !rankedIds.has(e.player_id))
    .map((e) => e.player_session_id)

  return { updates, inserts, deleteIds }
}
