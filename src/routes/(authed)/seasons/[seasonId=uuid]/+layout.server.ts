import { fail, type ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  if (!params.seasonId) {
    return fail(404)
  }

  const [seasonResult, scheduleResult] = await Promise.all([
    locals.supabase.from('seasons').select('*').eq('season_id', params.seasonId),
    locals.supabase
      .from('season_scoring_schedules')
      .select('multipliers')
      .eq('season_id', params.seasonId)
      .maybeSingle(),
  ])

  if (seasonResult.error) {
    throw new Error(seasonResult.error.message)
  }

  const multipliers: number[] | null = scheduleResult.data?.multipliers ?? null

  return {
    seasonData: seasonResult.data[0],
    multipliers,
  }
}
