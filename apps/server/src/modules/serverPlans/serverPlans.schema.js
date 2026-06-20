import { z } from 'zod'

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  features: z.array(z.string()).default([]),
  monthlyPrice: z.number().positive(),
  yearlyPrice: z.number().positive(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const updatePlanSchema = createPlanSchema.partial()

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
})

export const updateSubscriptionSchema = z.object({
  status: z.enum(['ACTIVE', 'CANCELLED', 'REJECTED']),
  adminNotes: z.string().optional().default(''),
})
