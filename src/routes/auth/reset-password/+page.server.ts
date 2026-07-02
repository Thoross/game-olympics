import { resetPasswordSchema } from '$lib/schemas/user/reset-password.js'
import { getZodErrors } from '$lib/utils/getZodErrors.js'
import { fail } from '@sveltejs/kit'
import z from 'zod'

export const actions = {
  reset: async ({ request, locals }) => {
    try {
      const formData = await request.formData()
      const { password, confirmPassword } = Object.fromEntries(formData)
      const valid = resetPasswordSchema.parse({ password, confirmPassword })

      const { error } = await locals.supabase.auth.updateUser({
        password: valid.password,
      })

      if (error) {
        return fail(500, {
          message: 'Failed to update password. The reset link may have expired.',
        })
      }

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
