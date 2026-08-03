import { getMultiplier, positionToPoints } from '$lib/server/utils.server'

export type GamePlayerSession = {
  player_id: string | null
  score: number
  position: number
}

export type GameSessionRow = {
  season_id: string
  season_name: string
  session_date_played: string
  player_sessions: GamePlayerSession[]
}

export type PlayerGameSeasonStat = {
  season_id: string
  season_name: string
  times_played: number
  avg_score: number
  avg_position: number
  total_standings_points: number
}

/**
 * The logged-in player's stats for a single game, grouped by season.
 *
 * `sessions` must be every session of the game (across all players) ordered by
 * date ascending — the standings-point multiplier depends on the nth play of the
 * game within a season across ALL sessions, so the per-season play counter is
 * incremented for every session even when the player didn't participate.
 *
 * Only the player's own participation is aggregated into the returned metrics.
 * Seasons the player never played the game in are omitted. Result is ordered by
 * the player's most-recently-played session in each season, descending.
 */
export function buildPlayerGameSeasonStats(
  sessions: GameSessionRow[],
  multipliersBySeasonId: Map<string, number[] | null>,
  playerId: string,
): PlayerGameSeasonStat[] {
  const playCountBySeason = new Map<string, number>()

  const acc = new Map<
    string,
    {
      season_id: string
      season_name: string
      times_played: number
      total_score: number
      total_position: number
      total_standings_points: number
      latest_played: string
    }
  >()

  for (const s of sessions) {
    const playCount = (playCountBySeason.get(s.season_id) ?? 0) + 1
    playCountBySeason.set(s.season_id, playCount)

    const ps = s.player_sessions.find((p) => p.player_id === playerId)
    if (!ps) continue

    const multiplier = getMultiplier(multipliersBySeasonId.get(s.season_id) ?? null, playCount)

    const existing = acc.get(s.season_id)
    if (existing) {
      existing.times_played++
      existing.total_score += ps.score
      existing.total_position += ps.position
      existing.total_standings_points += positionToPoints(ps.position) * multiplier
      if (s.session_date_played > existing.latest_played) {
        existing.latest_played = s.session_date_played
      }
    } else {
      acc.set(s.season_id, {
        season_id: s.season_id,
        season_name: s.season_name,
        times_played: 1,
        total_score: ps.score,
        total_position: ps.position,
        total_standings_points: positionToPoints(ps.position) * multiplier,
        latest_played: s.session_date_played,
      })
    }
  }

  return Array.from(acc.values())
    .sort((a, b) => b.latest_played.localeCompare(a.latest_played))
    .map((s) => ({
      season_id: s.season_id,
      season_name: s.season_name,
      times_played: s.times_played,
      avg_score: s.total_score / s.times_played,
      avg_position: s.total_position / s.times_played,
      total_standings_points: s.total_standings_points,
    }))
}

export function nextDisplayOrder(traits: { display_order: number }[]): number {
  if (traits.length === 0) return 0
  return Math.max(...traits.map((t) => t.display_order)) + 1
}

export type TraitBreakdown = {
  trait_name: string
  values: { trait_value: string; outings: number }[]
}

/**
 * Per-trait tallies of how many outings each trait value has — an outing being
 * one session in which that trait value was played.
 */
export function buildTraitBreakdowns(
  rows: { trait_name: string; trait_value: string }[],
): TraitBreakdown[] {
  const byTrait = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const values =
      byTrait.get(r.trait_name) ?? byTrait.set(r.trait_name, new Map()).get(r.trait_name)!
    values.set(r.trait_value, (values.get(r.trait_value) ?? 0) + 1)
  }

  const result: TraitBreakdown[] = []
  for (const [trait_name, values] of byTrait) {
    result.push({
      trait_name,
      values: [...values.entries()]
        .map(([trait_value, outings]) => ({ trait_value, outings }))
        .sort((a, b) => b.outings - a.outings || a.trait_value.localeCompare(b.trait_value)),
    })
  }
  result.sort((a, b) => a.trait_name.localeCompare(b.trait_name))
  return result
}
