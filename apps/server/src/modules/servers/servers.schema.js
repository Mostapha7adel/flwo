import { z } from 'zod'

export const createServerSchema = z.object({
  label: z.string().min(1).max(100),
  host: z.string().min(1),
  port: z.number().int().positive().default(22),
  username: z.string().min(1),
  authType: z.enum(['PASSWORD', 'SSH_KEY']).default('PASSWORD'),
  password: z.string().optional().default(''),
  sshKey: z.string().optional().default(''),
  domain: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

export const updateServerSchema = createServerSchema.partial()
