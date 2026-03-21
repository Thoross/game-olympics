import type { ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      created_at,
      games ( game_name ),
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_name )
      )
    `,
    )
    .eq('season_id', params.seasonId!)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return { sessions: data ?? [] }
}
