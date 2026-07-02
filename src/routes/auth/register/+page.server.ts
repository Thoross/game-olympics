import { registerSchema } from '$lib/schemas/user/registration'
import z from 'zod'
import { fail, redirect } from '@sveltejs/kit'
import { getZodErrors } from '$lib/utils/getZodErrors.js'

export const actions = {
  register: async ({ request, locals }) => {
    const formData = await request.formData()
    const { email, playerName, password, confirmPassword } = Object.fromEntries(formData)
    let valid
    try {
      valid = registerSchema.parse({ email, playerName, password, confirmPassword })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail(400, getZodErrors(error))
      }
      console.error(error)
      return fail(500, { message: 'Something went wrong. Please try again later' })
    }
    const { error: signUpError } = await locals.supabase.auth.signUp({
      email: valid.email,
      password: valid.password,
      options: {
        data: { player_name: valid.playerName },
      },
    })
    if (signUpError) {
      return fail(400, { message: signUpError.message })
    }
    redirect(303, '/auth/signin?registered=1')
  },
}
