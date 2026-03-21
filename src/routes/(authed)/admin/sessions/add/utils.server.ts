export type PlayerEntry = { player_id: string; score: number }

export type RankedPlayer = {
  player_id: string
  player_session_score: number
  player_session_position: number
}

export function rankPlayers(playerEntries: PlayerEntry[]): RankedPlayer[] {
  const sorted = [...playerEntries].sort((a, b) => b.score - a.score)
  let rank = 1
  return sorted.map((entry, idx) => {
    if (idx > 0 && sorted[idx - 1].score !== entry.score) rank = idx + 1
    return {
      player_id: entry.player_id,
      player_session_score: entry.score,
      player_session_position: rank,
    }
  })
}
