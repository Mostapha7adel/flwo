import { z } from 'zod'

export const createContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10),
})