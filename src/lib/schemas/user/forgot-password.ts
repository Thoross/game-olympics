import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address').min(1, 'Email is required'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
