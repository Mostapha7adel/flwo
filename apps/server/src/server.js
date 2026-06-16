import http from 'http'
import { Server } from 'socket.io'
import { execSync } from 'child_process'
import app from './app.js'
import { config } from './config/index.js'
import { prisma } from './config/database.js'
import { redis, safeRedis } from './config/redis.js'
import { setupChatSocket } from './modules/chat/chat.socket.js'
import { verifySocketToken } from './lib/jwt.js'

async function bootstrap() {
  try { await redis.connect() } catch {}

  try {
    await redis.ping()
    console.log('✅ Redis connected')
  } catch {
    console.warn('⚠️  Redis unavailable, running without cache')
  }

  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  }

  try {
    console.log('📦 Running database migrations...')
    execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Database schema synced')
  } catch (err) {
    console.error('❌ Database migration failed:', err)
    process.exit(1)
  }

  try {
    console.log('🌱 Running seed...')
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Seed complete')
  } catch (err) {
    console.warn('⚠️  Seed skipped (data may already exist)')
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
    console.log(`🚀 Server running on port ${config.PORT}`)
    console.log(`🌍 Environment: ${config.NODE_ENV}`)
  })

  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...')
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
