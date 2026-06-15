import { z } from 'zod'

export const createOrderSchema = z.object({
  templateId: z.string().min(1, 'معرف القالب مطلوب'),
  notes: z.string().max(500).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صحيح'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صحيح'),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صحيح'),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صحيح'),
  }),
  theme: z.enum(['light', 'dark']).default('light'),
  additionalPages: z.number().int().min(0).max(10).default(0),
  requirements: z.object({
    content: z.string().min(10).max(2000).optional(),
    deadline: z.string().optional(),
    domain: z.string().optional(),
    customFeatures: z.array(z.string()).default([]),
  }).optional()
})
