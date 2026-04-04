import type { ServerLoad } from '@sveltejs/kit'
import { buildStandings } from './utils.server.js'

export const load: ServerLoad = async ({ params, locals, parent }) => {
  const { multipliers } = await parent()

  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      session_date_played,
      games ( game_id ),
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_id, player_name )
      )
    `,
    )
    .eq('season_id', params.seasonId!)
    .order('session_date_played', { ascending: true })
    .order('session_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const sessions = (data ?? []).map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games
    return {
      session_id: s.session_id,
      game_id: game?.game_id ?? '',
      session_date_played: s.session_date_played,
      player_sessions: s.player_sessions,
    }
  })

  const standings = buildStandings(sessions, multipliers)

  return { standings }
}
