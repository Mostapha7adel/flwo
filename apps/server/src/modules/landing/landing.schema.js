import { z } from 'zod'

const safeText = (max = 200) =>
  z.string().max(max).regex(/^[^<>{}$`\\]*$/, 'HTML tags غير مسموح').transform(s => s.trim()).optional().default('')

const safeUrl = z.string().url('رابط غير صحيح').max(500).optional().or(z.literal(''))

export const SECTION_SCHEMAS = {
  hero: z.object({
    title: safeText(150).optional(),
    description: safeText(400).optional(),
    ctaText: safeText(50).optional(),
    secondaryText: safeText(50).optional(),
    badges: z.array(safeText(30)).max(6).default([]),
  }),

  heroSettings: z.object({
    imageUrl: z.string().max(500).optional().or(z.literal('')),
    gradientFrom: z.string().max(50).optional().default('from-brand-500/20'),
    gradientTo: z.string().max(50).optional().default('to-accent-500/20'),
    animation: z.enum(['float', 'fade', 'slide', 'pulse', 'none']).optional().default('float'),
  }),

  features: z.array(z.object({
    icon: z.string().max(30).regex(/^[a-zA-Z0-9-]+$/, 'اسم أيقونة غير صحيح'),
    title: safeText(60),
    description: safeText(250),
  })).optional(),

  steps: z.array(z.object({
    title: safeText(60),
    description: safeText(250),
  })).min(1).max(8).optional(),

  testimonials: z.array(z.object({
    name: safeText(80),
    text: safeText(500),
    rating: z.number().min(1).max(5).default(5),
  })).max(20).optional(),

  footer: z.object({
    email: z.string().email('بريد غير صحيح').optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    address: safeText(200).optional().or(z.literal('')),
    socialLinks: z.array(z.object({
      platform: z.string().max(30),
      url: z.string().max(500),
    })).max(10).optional().default([]),
  }).optional(),

  about: z.object({
    title: safeText(150).optional(),
    description: safeText(500).optional(),
    stats: z.array(z.object({
      num: z.string().max(20),
      label: safeText(50),
    })).max(8).optional().default([]),
  }).optional(),

  aboutPage: z.object({
    title: safeText(150).optional(),
    description: safeText(500).optional(),
    story: safeText(2000).optional().or(z.literal('')),
    imageUrl: z.string().max(500).optional().or(z.literal('')),
  }).optional(),

  demoVideo: z.object({
    videoUrl: z.string().max(500).optional().or(z.literal('')),
    title: safeText(100).optional().or(z.literal('')),
  }).optional(),

  site: z.object({
    logoUrl: z.string().max(500).optional().or(z.literal('')),
  }).optional(),
}

export function getLandingSchema(section) {
  return SECTION_SCHEMAS[section] || null
}
