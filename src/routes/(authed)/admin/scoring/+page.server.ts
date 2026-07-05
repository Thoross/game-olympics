import { fail } from '@sveltejs/kit'
import type { Actions, ServerLoad } from '@sveltejs/kit'
import { z } from 'zod'
import { requireAdmin } from '$lib/server/authorization'
import { getZodErrors } from '$lib/utils/getZodErrors'
import { multiplierScheduleSchema } from '$lib/schemas/scoring/schedule'

export const load: ServerLoad = async ({ locals, url }) => {
  requireAdmin(locals.user)

  const [seasonsResult, schedulesResult] = await Promise.all([
    locals.supabase
      .from('seasons')
      .select('season_id, season_name, season_status')
      .order('created_at', { ascending: true }),
    locals.supabase.from('season_scoring_schedules').select('season_id, multipliers'),
  ])

  const scheduleMap = new Map((schedulesResult.data ?? []).map((s) => [s.season_id, s.multipliers]))

  const seasons = (seasonsResult.data ?? []).map((s) => ({
    ...s,
    multipliers: scheduleMap.get(s.season_id) ?? null,
  }))

  const focusSeasonId = url.searchParams.get('season') ?? null

  return { seasons, focusSeasonId }
}

export const actions: Actions = {
  upsertSchedule: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const season_id = formData.get('season_id') as string

    if (!season_id) {
      return fail(400, { season_id: '', errors: { multipliers: 'Missing season ID.' } })
    }

    const raw = formData.getAll('multipliers')
    const multipliers = raw.map((v) => Number(v))

    try {
      const valid = multiplierScheduleSchema.parse({ multipliers })
      const { error } = await locals.supabase
        .from('season_scoring_schedules')
        .upsert({ season_id, multipliers: valid.multipliers }, { onConflict: 'season_id' })

      if (error) {
        return fail(500, { season_id, errors: { multipliers: 'Failed to save schedule.' } })
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return fail(400, { season_id, ...getZodErrors(err) })
      }
      return fail(500, { season_id, errors: { multipliers: 'Something went wrong.' } })
    }

    return { upsertSuccess: true, season_id }
  },
}
