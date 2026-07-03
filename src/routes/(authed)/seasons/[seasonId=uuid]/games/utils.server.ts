export type GamePlayedSession = {
  game_id: string
  game_name: string
  session_date_played: string
}

export type GamePlayedRow = {
  game_id: string
  game_name: string
  // Formatted date range (single date when played once), e.g. "Jul 1 – Jul 24, 2026".
  dates: string
  // The single season-level chooser name for the game, or null when unset.
  chosen_by: string | null
}

// Parse a 'YYYY-MM-DD' (Postgres `date`) as a local calendar day, avoiding the
// UTC→local off-by-one that `new Date('YYYY-MM-DD')` introduces in negative-offset zones.
function toLocalDate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatFull(date: string): string {
  return toLocalDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRange(min: string, max: string): string {
  if (min === max) return formatFull(min)
  const minD = toLocalDate(min)
  const maxD = toLocalDate(max)
  const sameYear = minD.getFullYear() === maxD.getFullYear()
  const left = sameYear
    ? minD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : formatFull(min)
  return `${left} – ${formatFull(max)}`
}

/**
 * One row per game: the min→max date range across its sessions and the single
 * season-level chooser (from season_games). Rows ordered by earliest session
 * date ascending (first-played first).
 */
export function buildGamesPlayed(
  sessions: GamePlayedSession[],
  chooserByGameId: Map<string, string | null>,
): GamePlayedRow[] {
  const gameMap = new Map<
    string,
    { game_id: string; game_name: string; min: string; max: string }
  >()

  for (const s of sessions) {
    if (!s.game_id) continue
    const existing = gameMap.get(s.game_id)
    if (existing) {
      if (s.session_date_played < existing.min) existing.min = s.session_date_played
      if (s.session_date_played > existing.max) existing.max = s.session_date_played
    } else {
      gameMap.set(s.game_id, {
        game_id: s.game_id,
        game_name: s.game_name,
        min: s.session_date_played,
        max: s.session_date_played,
      })
    }
  }

  return Array.from(gameMap.values())
    .sort((a, b) => a.min.localeCompare(b.min))
    .map((g) => ({
      game_id: g.game_id,
      game_name: g.game_name,
      dates: formatRange(g.min, g.max),
      chosen_by: chooserByGameId.get(g.game_id) ?? null,
    }))
}
