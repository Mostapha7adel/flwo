import { z } from 'zod'
import { ORDER_STATUS } from '../../lib/constants.js'

export const userStatusSchema = z.object({ isActive: z.boolean() })
export const userRoleSchema = z.object({ role: z.enum(['CLIENT', 'SUPPORT', 'ACCOUNTS']) })
export const orderStatusSchema = z.object({ status: z.nativeEnum(ORDER_STATUS) })
export const banUserSchema = z.object({ bannedUntil: z.string().nullable() })
export const setVipSchema = z.object({ isVIP: z.boolean() })
export const createAccountSchema = z.object({
  firstName: z.string().min(2, 'الاسم الأول مطلوب').max(50),
  lastName: z.string().min(2, 'اسم العائلة مطلوب').max(50),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح').max(20),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.enum(['SUPPORT', 'ACCOUNTS', 'ADMIN']),
})
