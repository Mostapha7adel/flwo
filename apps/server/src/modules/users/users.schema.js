import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح').optional(),
  lastName: z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح').optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'رقم هاتف غير صحيح').optional(),
})
