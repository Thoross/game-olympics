import { getMultiplier, positionToPoints } from '$lib/server/utils.server'

export type PlayerStanding = {
  player_id: string
  player_name: string
  games_played: number
  standings_points: number
  avg_score: number
  avg_position: number
  games_chosen: number
  // Newest-first, up to 4 finish positions (most recent session first).
  // Values may be 0 for missing/unknown positions — the view renders those as a dash.
  last_positions: number[]
  // Nullable dues paid date (ISO date string) merged in from season_players; null = unpaid.
  date_paid: string | null
}

export type RawPlayerSession = {
  player_session_score: number | null
  player_session_position: number | null
  player:
    | { player_id: string; player_name: string }
    | { player_id: string; player_name: string }[]
    | null
}

export type RawSession = {
  session_id: string
  game_id: string
  session_date_played: string
  player_sessions: RawPlayerSession[] | null
}

// Counts distinct games chosen per player from season_games rows (chosen_by = player_id).
// Merged onto standings in the load, exactly like date_paid.
export function countGamesChosen(seasonGames: { chosen_by: string | null }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const sg of seasonGames) {
    if (sg.chosen_by) counts.set(sg.chosen_by, (counts.get(sg.chosen_by) ?? 0) + 1)
  }
  return counts
}

export function buildStandings(
  sessions: RawSession[],
  multipliers: number[] | null,
): PlayerStanding[] {
  const playerMap = new Map<
    string,
    Omit<PlayerStanding, 'last_positions'> & { _total_score: number; _positions: number[] }
  >()
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
        existing._positions.push(position)
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
          _positions: [position],
          avg_score: score,
          avg_position: position,
          games_chosen: 0,
          date_paid: null,
        })
      }
    }
  }

  return (
    Array.from(playerMap.values())
      .map((p) => ({
        player_id: p.player_id,
        player_name: p.player_name,
        games_played: p.games_played,
        standings_points: p.standings_points,
        avg_score: p.avg_score,
        avg_position: p.avg_position,
        games_chosen: p.games_chosen,
        // Sessions arrive oldest-first, so the last 4 reversed gives newest-first.
        last_positions: p._positions.slice(-4).reverse(),
        date_paid: p.date_paid,
      }))
      // Sort: standings_points desc, then avg_score desc (tiebreaker retained though not displayed).
      .sort((a, b) => b.standings_points - a.standings_points || b.avg_score - a.avg_score)
  )
}
