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

export type MetadataInputRow = {
  player_session_id: string
  fieldValues: { field_id: string; value: string }[]
}

export function collectMetadataInserts(
  rows: MetadataInputRow[],
): { player_session_id: string; field_id: string; value: string }[] {
  const inserts: { player_session_id: string; field_id: string; value: string }[] = []
  for (const row of rows) {
    for (const fv of row.fieldValues) {
      const value = fv.value.trim()
      if (value === '') continue
      inserts.push({ player_session_id: row.player_session_id, field_id: fv.field_id, value })
    }
  }
  return inserts
}
