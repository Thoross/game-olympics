import { registerSchema } from '$lib/schemas/user/registration'
import z from 'zod'
import { fail } from '@sveltejs/kit'
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
      console.error('signup failed', signUpError)
      const rawMessage = signUpError.message ?? ''
      const code = (signUpError as { code?: string }).code ?? ''
      const status = signUpError.status
      const alreadyRegistered =
        /already registered/i.test(rawMessage) ||
        /already exists/i.test(rawMessage) ||
        code === 'user_already_exists' ||
        status === 422
      if (alreadyRegistered) {
        return fail(400, {
          message:
            'An account with that email already exists. Try signing in or resetting your password.',
        })
      }
      return fail(400, {
        message: 'We could not create your account. Please try again.',
      })
    }
    return { success: true, email: valid.email }
  },
}
