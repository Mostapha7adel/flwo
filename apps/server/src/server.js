import http from 'http'
import { Server } from 'socket.io'
import { execSync } from 'child_process'
import app from './app.js'
import { config } from './config/index.js'
import { prisma } from './config/database.js'
import { redis, safeRedis } from './config/redis.js'
import { setupChatSocket } from './modules/chat/chat.socket.js'
import { verifySocketToken } from './lib/jwt.js'
import { logger } from './lib/logger.js'

async function bootstrap() {
  try { await redis.connect() } catch {}

  try {
    await redis.ping()
    logger.info('Redis connected')
  } catch {
    logger.warn('Redis unavailable, running without cache')
  }

  try {
    await prisma.$connect()
    logger.info('Database connected')
  } catch (err) {
    logger.fatal(err, 'Database connection failed')
    process.exit(1)
  }

  try {
    logger.info('Running database migrations...')
    execSync('npx --yes prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd(), timeout: 30000 })
    logger.info('Database schema synced')
  } catch (err) {
    logger.warn({ err: err.message }, 'Migrate deploy failed, trying db push...')
    try {
      execSync('npx --yes prisma db push --skip-generate', { stdio: 'inherit', cwd: process.cwd(), timeout: 30000 })
      logger.info('Database schema synced via push')
    } catch (err2) {
      logger.warn('Db push also failed, server will start anyway — schema may be out of date')
    }
  }

  const server = http.createServer(app)

  const io = new Server(server, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))
    const decoded = await verifySocketToken(token)
    if (!decoded) return next(new Error('Invalid token'))
    socket.userId = decoded.sub
    socket.userRole = decoded.role
    next()
  })

  setupChatSocket(io)
  app.set('io', io)

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started')
  })

  const shutdown = async () => {
    logger.info('Shutting down gracefully...')
    io.close()
    server.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

bootstrap()
