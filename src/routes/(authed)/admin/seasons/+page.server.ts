import type { ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ locals }) => {
  const { data, error } = await locals.supabase
    .from('seasons')
    .select('season_id, season_name, season_description, season_status')
    .order('created_at', { ascending: false })

  if (error) {
    return { seasons: [] }
  }

  return { seasons: data }
}
