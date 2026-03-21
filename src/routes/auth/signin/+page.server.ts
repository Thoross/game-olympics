import { signInSchema } from '$lib/schemas/user/signin.js'
import { getZodErrors } from '$lib/utils/getZodErrors.js'
import { AuthError } from '@supabase/supabase-js'
import { fail } from '@sveltejs/kit'
import z from 'zod'

export const actions = {
  signin: async ({ request, locals }) => {
    try {
      const formData = await request.formData()
      const { email, password } = Object.fromEntries(formData)
      const valid = signInSchema.parse({ email, password })
      await locals.supabase.auth.signInWithPassword({
        email: valid.email,
        password: valid.password,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = getZodErrors(error)
        return fail(400, errors)
      } else if (error instanceof AuthError) {
        return fail(500, {
          message: 'The entered email or password are incorrect. Please try again.',
        })
      } else {
        return fail(500, {
          message: 'Something went wrong. Please try again later',
        })
      }
    }
  },
}
