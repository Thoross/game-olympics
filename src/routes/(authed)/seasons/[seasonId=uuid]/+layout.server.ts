import { fail, type ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  if (!params.seasonId) {
    return fail(404)
  }
  const { data, error } = await locals.supabase
    .from('seasons')
    .select('*')
    .eq('season_id', params.seasonId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    seasonData: data[0],
  }
}
