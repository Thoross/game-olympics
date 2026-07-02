import { error, type ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  const { data, error: dbError } = await locals.supabase
    .from('games')
    .select('game_id, game_name, game_bgg_url')
    .eq('game_id', params.gameId!)
    .single()

  if (dbError || !data) {
    error(404, 'Game not found')
  }

  return { game: data }
}
