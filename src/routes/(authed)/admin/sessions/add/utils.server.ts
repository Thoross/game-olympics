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

export type TraitInputRow = {
  player_session_id: string
  traitValues: { trait_id: string; trait_value: string }[]
}

/**
 * Turn recorded trait values into `player_session_metadata` rows, dropping blanks.
 *
 * This is the write boundary: the returned rows are DB-shaped (`field_id`, `value`)
 * because they go straight into the insert, while the input speaks traits (ADR-0002).
 */
export function collectTraitInserts(
  rows: TraitInputRow[],
): { player_session_id: string; field_id: string; value: string }[] {
  const inserts: { player_session_id: string; field_id: string; value: string }[] = []
  for (const row of rows) {
    for (const tv of row.traitValues) {
      const value = tv.trait_value.trim()
      if (value === '') continue
      inserts.push({ player_session_id: row.player_session_id, field_id: tv.trait_id, value })
    }
  }
  return inserts
}
