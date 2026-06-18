import { z } from 'zod'

export const createVersionSchema = z.object({
  version: z.string().min(1).max(20),
  changelog: z.string().optional().default(''),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().default(0),
  isCurrent: z.boolean().default(false),
})
