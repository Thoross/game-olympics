import { z } from 'zod'

export const seasonStatusEnum = z.enum(['UPCOMING', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED'])

export const addSeasonSchema = z.object({
  seasonName: z.string().min(1, 'Season name is required'),
  seasonDescription: z.string().optional().or(z.literal('')),
  seasonStatus: seasonStatusEnum,
})

export type AddSeasonInput = z.infer<typeof addSeasonSchema>
