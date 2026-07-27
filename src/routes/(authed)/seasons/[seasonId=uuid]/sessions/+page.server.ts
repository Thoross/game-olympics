import type { ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      session_date_played,
      games ( game_id, game_name ),
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_name ),
        player_session_metadata ( value, game_metadata_fields ( field_name ) )
      )
    `,
    )
    .eq('season_id', params.seasonId!)
    .order('session_date_played', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return { sessions: data ?? [] }
}
