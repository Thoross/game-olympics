import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { addSeasonSchema } from '$lib/schemas/season/add'
import { getZodErrors } from '$lib/utils/getZodErrors'
import { requireAdmin } from '$lib/server/authorization'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const seasonName = formData.get('seasonName')
    const seasonDescription = formData.get('seasonDescription')
    const seasonStatus = formData.get('seasonStatus')

    let newSeasonId: string

    try {
      const valid = addSeasonSchema.parse({ seasonName, seasonDescription, seasonStatus })

      const { data, error } = await locals.supabase
        .from('seasons')
        .insert({
          season_name: valid.seasonName,
          season_description: valid.seasonDescription || null,
          season_status: valid.seasonStatus,
        })
        .select('season_id')
        .single()

      if (error || !data) {
        return fail(500, { message: error?.message ?? 'Failed to create season.' })
      }

      newSeasonId = data.season_id
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail(400, getZodErrors(error))
      }
      return fail(500, { message: 'Something went wrong. Please try again.' })
    }

    redirect(303, `/admin/seasons/${newSeasonId}`)
  },
}
