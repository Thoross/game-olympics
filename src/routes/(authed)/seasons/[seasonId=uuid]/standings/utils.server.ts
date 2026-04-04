import { getMultiplier, positionToPoints } from '$lib/server/utils.server'

export type PlayerStanding = {
  player_id: string
  player_name: string
  games_played: number
  standings_points: number
  avg_score: number
  avg_position: number
}

export type RawPlayerSession = {
  player_session_score: number | null
  player_session_position: number | null
  player: { player_id: string; player_name: string } | { player_id: string; player_name: string }[] | null
}

export type RawSession = {
  session_id: string
  game_id: string
  session_date_played: string
  player_sessions: RawPlayerSession[] | null
}

export function buildStandings(sessions: RawSession[], multipliers: number[] | null): PlayerStanding[] {
  const playerMap = new Map<string, PlayerStanding & { _total_score: number }>()
  const playCountByGame = new Map<string, number>()

  for (const session of sessions) {
    const playCount = (playCountByGame.get(session.game_id) ?? 0) + 1
    playCountByGame.set(session.game_id, playCount)
    const multiplier = getMultiplier(multipliers, playCount)

    for (const ps of session.player_sessions ?? []) {
      const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
      if (!p) continue
      const score = ps.player_session_score ?? 0
      const position = ps.player_session_position ?? 0
      const points = positionToPoints(position) * multiplier
      const existing = playerMap.get(p.player_id)
      if (existing) {
        existing.games_played++
        existing.standings_points += points
        existing._total_score += score
        existing.avg_score = existing._total_score / existing.games_played
        existing.avg_position =
          (existing.avg_position * (existing.games_played - 1) + position) / existing.games_played
      } else {
        playerMap.set(p.player_id, {
          player_id: p.player_id,
          player_name: p.player_name,
          games_played: 1,
          standings_points: points,
          _total_score: score,
          avg_score: score,
          avg_position: position,
        })
      }
    }
  }

  return Array.from(playerMap.values())
    .map(({ _total_score: _, ...rest }) => rest)
    .sort((a, b) => b.standings_points - a.standings_points || b.avg_score - a.avg_score)
}
