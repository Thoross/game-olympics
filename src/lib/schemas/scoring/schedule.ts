import { z } from 'zod'

export const multiplierScheduleSchema = z.object({
  multipliers: z.array(z.number().int().positive()).min(1, 'Schedule must have at least one step'),
})

export type MultiplierSchedule = z.infer<typeof multiplierScheduleSchema>
