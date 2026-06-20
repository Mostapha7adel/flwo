import { z } from 'zod'

export const updateProjectConfigSchema = z.object({
  config: z.record(z.any()),
})

export const updateProjectUrlSchema = z.object({
  previewUrl: z.string().url().optional(),
  publishedUrl: z.string().url().optional(),
})

export const updateProjectConfigBulkSchema = z.object({
  config: z.record(z.any()),
})
