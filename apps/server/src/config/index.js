import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  CLIENT_URL: z.string().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:5000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  TOKEN_HASH_SECRET: z.string().min(16, 'TOKEN_HASH_SECRET must be at least 16 chars'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  ADMIN_ROUTE_HINT: z.string().default('admin'),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().optional().default('noreply@designflow.com'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
