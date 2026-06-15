import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'الرسالة لا يمكن أن تكون فارغة').max(2000, 'الرسالة طويلة جداً'),
})
