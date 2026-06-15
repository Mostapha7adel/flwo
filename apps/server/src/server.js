import http from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { config } from './config/index.js'
import { prisma } from './config/database.js'
import { redis, safeRedis } from './config/redis.js'
import { setupChatSocket } from './modules/chat/chat.socket.js'
import { verifySocketToken } from './lib/jwt.js'

async function bootstrap() {
  try { await redis.connect() } catch {} // try connecting in background

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

  const server = http.createServer(app)

  const io = new Server(server, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
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
