import { z } from 'zod'

export const createTemplateSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10),
  category: z.string().min(2).max(50),
  price: z.coerce.number(),
  demoUrl: z.string().url().optional(),
  previewUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  defaultColors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string()
  }),
  components: z.object({
    sections: z.array(z.object({
      id: z.string(),
      label: z.string(),
      draggable: z.boolean().default(true)
    }))
  }),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().default(0),
  configSchema: z.any().optional(),
  deploymentType: z.string().optional(),
  deploymentScript: z.string().optional(),
  sourceUrl: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  features: z.any().optional(),
  templateType: z.string().optional(),
  framework: z.string().optional(),
})

export const updateTemplateSchema = createTemplateSchema.partial()
