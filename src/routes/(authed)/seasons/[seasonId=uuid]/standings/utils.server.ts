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
  player_sessions: RawPlayerSession[] | null
}

export function positionToPoints(position: number): number {
  const points: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 }
  return points[position] ?? 0
}

export function buildStandings(sessions: RawSession[]): PlayerStanding[] {
  const playerMap = new Map<string, PlayerStanding & { _total_score: number }>()

  for (const session of sessions) {
    for (const ps of session.player_sessions ?? []) {
      const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
      if (!p) continue
      const score = ps.player_session_score ?? 0
      const position = ps.player_session_position ?? 0
      const existing = playerMap.get(p.player_id)
      if (existing) {
        existing.games_played++
        existing.standings_points += positionToPoints(position)
        existing._total_score += score
        existing.avg_score = existing._total_score / existing.games_played
        existing.avg_position =
          (existing.avg_position * (existing.games_played - 1) + position) / existing.games_played
      } else {
        playerMap.set(p.player_id, {
          player_id: p.player_id,
          player_name: p.player_name,
          games_played: 1,
          standings_points: positionToPoints(position),
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
