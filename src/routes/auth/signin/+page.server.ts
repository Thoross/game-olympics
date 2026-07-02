import { signInSchema } from '$lib/schemas/user/signin.js'
import { getZodErrors } from '$lib/utils/getZodErrors.js'
import { fail } from '@sveltejs/kit'
import z from 'zod'

export const actions = {
  signin: async ({ request, locals }) => {
    const formData = await request.formData()
    const { email, password } = Object.fromEntries(formData)
    let valid
    try {
      valid = signInSchema.parse({ email, password })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fail(400, getZodErrors(error))
      }
      console.error(error)
      return fail(500, { message: 'Something went wrong. Please try again later.' })
    }
    const { error: signInError } = await locals.supabase.auth.signInWithPassword({
      email: valid.email,
      password: valid.password,
    })
    if (signInError) {
      return fail(400, {
        message: 'The entered email or password are incorrect. Please try again.',
      })
    }
  },
}
