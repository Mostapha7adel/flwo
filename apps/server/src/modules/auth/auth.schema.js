import { z } from 'zod'

export const registerSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح'),
  lastName: z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'رقم هاتف غير صحيح'),
  email: z.string().email('بريد إلكتروني غير صحيح').toLowerCase(),
  password: z.string()
    .min(8, 'كلمة المرور 8 أحرف على الأقل')
    .regex(/^(?=.*[A-Z])/, 'يجب أن تحتوي على حرف كبير')
    .regex(/^(?=.*[0-9])/, 'يجب أن تحتوي على رقم')
    .regex(/^(?=.*[^A-Za-z0-9])/, 'يجب أن تحتوي على رمز خاص'),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirmPassword']
}).transform(d => {
  const { confirmPassword, ...rest } = d
  return rest
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
    .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/)
})
