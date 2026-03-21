import { forgotPasswordSchema } from '$lib/schemas/user/forgot-password.js'
import { getZodErrors } from '$lib/utils/getZodErrors.js'
import { fail } from '@sveltejs/kit'
import z from 'zod'

export const actions = {
  forgot: async ({ request, locals, url }) => {
    try {
      const formData = await request.formData()
      const { email } = Object.fromEntries(formData)
      const valid = forgotPasswordSchema.parse({ email })

      const { error } = await locals.supabase.auth.resetPasswordForEmail(valid.email, {
        redirectTo: `${url.origin}/auth/reset-password`,
      })

      if (error) {
        return fail(500, {
          message: 'Something went wrong. Please try again later.',
        })
      }

      // Always return success to prevent email enumeration
      return { success: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = getZodErrors(error)
        return fail(400, errors)
      }
      return fail(500, {
        message: 'Something went wrong. Please try again later.',
      })
    }
  },
}
