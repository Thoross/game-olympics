import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { addGameSchema } from '$lib/schemas/game/add'
import { getZodErrors } from '$lib/utils/getZodErrors'
import { requireAdmin } from '$lib/server/authorization'
import { extractBggId, fetchBggGame } from '$lib/server/bgg.server'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const gameName = formData.get('gameName')
    const gameBggUrl = formData.get('gameBggUrl')

    try {
      const valid = addGameSchema.parse({ gameName, gameBggUrl })

      const bggUrl = valid.gameBggUrl || null

      // Best-effort BGG enrichment. Failure/no-URL must not block the insert —
      // fetchBggGame never throws and returns null, leaving metadata columns unset.
      const bggId = extractBggId(bggUrl)
      const bgg = bggId ? await fetchBggGame(bggId) : null

      const { error } = await locals.supabase.from('games').insert({
        game_name: valid.gameName,
        game_bgg_url: bggUrl,
        game_bgg_id: bgg?.bggId ?? bggId,
        game_image_url: bgg?.imageUrl ?? null,
        game_description: bgg?.description ?? null,
        game_year_published: bgg?.yearPublished ?? null,
        game_bgg_rating: bgg?.rating ?? null,
        game_bgg_synced_at: bgg ? new Date().toISOString() : null,
      })

      if (error) {
        return fail(500, { message: error.message })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail(400, getZodErrors(error))
      }
      return fail(500, { message: 'Something went wrong. Please try again.' })
    }

    redirect(303, '/games')
  },
}
