import { z } from 'zod'

export const metadataFieldSchema = z.object({
  field_name: z
    .string()
    .trim()
    .min(1, 'Field name is required')
    .max(50, 'Field name must be 50 characters or fewer'),
})

export type MetadataFieldInput = z.infer<typeof metadataFieldSchema>

export const metadataValueSchema = z
  .string()
  .trim()
  .max(100, 'Value must be 100 characters or fewer')
