import type { ZodError } from 'zod'

type ErrorMapper = (error: ZodError) => { errors: Record<string, string> }

export const getZodErrors: ErrorMapper = (error) => ({
  errors: Object.fromEntries(
    error.issues.map((innerError) => {
      return [innerError.path[0], innerError.message]
    }),
  ),
})
