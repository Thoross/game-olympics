import type { ServerLoad } from '@sveltejs/kit'
import { buildStandings } from './utils.server.js'

export const load: ServerLoad = async ({ params, locals }) => {
  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_id, player_name )
      )
    `,
    )
    .eq('season_id', params.seasonId!)

  if (error) {
    throw new Error(error.message)
  }

  const standings = buildStandings(data ?? [])

  return { standings }
}
