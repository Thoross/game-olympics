import { registerSchema } from '$lib/schemas/user/registration'
import z from 'zod'
import { fail, redirect } from '@sveltejs/kit'
import { getZodErrors } from '$lib/utils/getZodErrors.js'

export const actions = {
  register: async ({ request, locals }) => {
    const formData = await request.formData()
    const { email, playerName, password, confirmPassword } = Object.fromEntries(formData)
    try {
      const valid = registerSchema.parse({ email, playerName, password, confirmPassword })
      await locals.supabase.auth.signUp(valid.email, valid.password, valid.playerName)
      redirect(303, '/')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = getZodErrors(error)
        return fail(400, errors)
      } else {
        return fail(500, {
          message: 'Something went wrong. Please try again later',
        })
      }
    }
  },
}
