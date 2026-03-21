import type { ServerLoad } from '@sveltejs/kit'
import { Constants } from '$lib/database.types'

export const load: ServerLoad = async ({ locals, url }) => {
  const playerId = locals.user?.player_id

  const searchParams = url.searchParams

  const { data: playerSeasons, error } = await locals.supabase
    .from('season_players')
    .select('*')
    .eq('player_id', playerId ?? '')

  if (playerSeasons?.length === 0 || error) {
    return {
      seasons: [],
    }
  }
  const seasonIds = playerSeasons.map((season) => season.season_id)
  let query = locals.supabase.from('seasons').select('*').in('season_id', seasonIds)

  const seasonStatus = searchParams.get(
    'season-status',
  ) as (typeof Constants.public.Enums)['Season Status'][number]
  if (seasonStatus) {
    query = query.eq('season_status', seasonStatus)
  }

  const nameFilter = searchParams.get('season-name')
  if (nameFilter) {
    query = query.ilike('season_name', `%${nameFilter}%`)
  }

  const { data, error: seasonError } = await query

  if (seasonError) {
    return {
      seasons: [],
    }
  }
  return {
    seasons: data,
  }
}
