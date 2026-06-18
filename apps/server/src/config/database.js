import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger.js'

const poolSize = parseInt(process.env.DATABASE_POOL_SIZE || '20', 10)

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function connectDB() {
  try {
    await prisma.$connect()
    logger.info({ poolSize }, 'PostgreSQL connected')
  } catch (err) {
    logger.fatal(err, 'Database connection failed')
    process.exit(1)
  }
}
