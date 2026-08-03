import { z } from 'zod'

export const traitSchema = z.object({
  trait_name: z
    .string()
    .trim()
    .min(1, 'Trait name is required')
    .max(50, 'Trait name must be 50 characters or fewer'),
})

export type TraitInput = z.infer<typeof traitSchema>

export const traitValueSchema = z
  .string()
  .trim()
  .max(100, 'Trait value must be 100 characters or fewer')
