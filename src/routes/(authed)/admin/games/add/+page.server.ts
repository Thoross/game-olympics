import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { addGameSchema } from '$lib/schemas/game/add'
import { getZodErrors } from '$lib/utils/getZodErrors'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const gameName = formData.get('gameName')
    const gameBggUrl = formData.get('gameBggUrl')

    try {
      const valid = addGameSchema.parse({ gameName, gameBggUrl })

      const { error } = await locals.supabase.from('games').insert({
        game_name: valid.gameName,
        game_bgg_url: valid.gameBggUrl || null,
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
