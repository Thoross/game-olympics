import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { addSeasonSchema } from '$lib/schemas/season/add'
import { getZodErrors } from '$lib/utils/getZodErrors'
import { requireAdmin } from '$lib/server/authorization'
import { uploadSeasonImage } from '$lib/server/seasonImages'
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

      // Upload any provided images and set them on the just-created row. The season
      // already exists if an upload fails — the admin can retry on the edit page.
      const logo = formData.get('logo') as File | null
      const banner = formData.get('banner') as File | null
      const imageUpdate: { season_logo_url?: string; season_banner_url?: string } = {}

      if (logo && logo.size > 0) {
        const result = await uploadSeasonImage(locals.supabase, newSeasonId, 'logo', logo)
        if ('error' in result) return fail(400, { message: result.error })
        imageUpdate.season_logo_url = result.url
      }

      if (banner && banner.size > 0) {
        const result = await uploadSeasonImage(locals.supabase, newSeasonId, 'banner', banner)
        if ('error' in result) return fail(400, { message: result.error })
        imageUpdate.season_banner_url = result.url
      }

      if (Object.keys(imageUpdate).length > 0) {
        const { error: imageError } = await locals.supabase
          .from('seasons')
          .update(imageUpdate)
          .eq('season_id', newSeasonId)
        if (imageError) {
          return fail(500, { message: 'Season created, but failed to save images.' })
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail(400, getZodErrors(error))
      }
      return fail(500, { message: 'Something went wrong. Please try again.' })
    }

    redirect(303, `/admin/seasons/${newSeasonId}`)
  },
}
