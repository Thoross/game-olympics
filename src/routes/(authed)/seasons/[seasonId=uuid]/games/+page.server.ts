import type { ServerLoad } from '@sveltejs/kit'
import { buildGamesPlayed, type GamePlayedSession } from './utils.server.js'

export const load: ServerLoad = async ({ params, locals }) => {
  const [sessionsResult, rosterResult, seasonGamesResult] = await Promise.all([
    locals.supabase
      .from('sessions')
      .select(
        `
        session_date_played,
        games ( game_id, game_name )
      `,
      )
      .eq('season_id', params.seasonId!)
      .order('session_date_played', { ascending: true })
      .order('session_id', { ascending: true }),
    locals.supabase
      .from('season_players')
      .select('player ( player_id, player_name )')
      .eq('season_id', params.seasonId!),
    locals.supabase
      .from('season_games')
      .select('game_id, chosen_by')
      .eq('season_id', params.seasonId!),
  ])

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message)
  }

  // Map chooser id → name from the season roster (choosers are season members).
  const nameById = new Map<string, string>()
  for (const row of rosterResult.data ?? []) {
    const p = Array.isArray(row.player) ? row.player[0] : row.player
    if (p) nameById.set(p.player_id, p.player_name)
  }

  // One chooser per game, resolved to a name (null when unset or not on the roster).
  const chooserByGameId = new Map<string, string | null>(
    (seasonGamesResult.data ?? []).map((r) => [
      r.game_id,
      r.chosen_by ? (nameById.get(r.chosen_by) ?? null) : null,
    ]),
  )

  const sessions: GamePlayedSession[] = (sessionsResult.data ?? []).map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games
    return {
      game_id: game?.game_id ?? '',
      game_name: game?.game_name ?? '',
      session_date_played: s.session_date_played,
    }
  })

  return { games: buildGamesPlayed(sessions, chooserByGameId) }
}
