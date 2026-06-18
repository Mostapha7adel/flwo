import { z } from 'zod'

export const createDeploymentSchema = z.object({
  type: z.enum(['DOWNLOAD', 'MANUAL', 'AUTO_SSH', 'AUTO_DOCKER', 'AUTO_GIT']).default('DOWNLOAD'),
  serverId: z.string().optional().default(''),
  domain: z.string().optional().default(''),
  sslEnabled: z.boolean().default(false),
})
