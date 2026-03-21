import type { ServerLoad } from '@sveltejs/kit'
import { buildGameStats } from '$routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server'

export const load: ServerLoad = async ({ locals, url }) => {
  let query = locals.supabase
    .from('games')
    .select('game_id, game_name, game_bgg_url')
    .order('game_name')

  const nameFilter = url.searchParams.get('game-name')
  if (nameFilter) {
    query = query.ilike('game_name', `%${nameFilter}%`)
  }

  const { data, error } = await query

  if (error) {
    return { games: [] }
  }

  return { games: data }
}
