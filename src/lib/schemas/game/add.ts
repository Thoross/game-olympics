import { z } from 'zod'

export const addGameSchema = z.object({
  gameName: z.string().min(1, 'Game name is required'),
  gameBggUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type AddGameInput = z.infer<typeof addGameSchema>
