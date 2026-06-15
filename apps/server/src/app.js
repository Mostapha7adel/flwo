import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import authRoutes from './modules/auth/auth.routes.js'
import userRoutes from './modules/users/users.routes.js'
import templateRoutes from './modules/templates/templates.routes.js'
import orderRoutes from './modules/orders/orders.routes.js'
import chatRoutes from './modules/chat/chat.routes.js'
import landingRoutes from './modules/landing/landing.routes.js'
import contactRoutes from './modules/contact/contact.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import notificationRoutes from './modules/notifications/notifications.routes.js'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: ["'self'", ...(config.FRONTEND_URL ? [config.FRONTEND_URL] : [])],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameAncestors: ["'none'"],
    },
  },
}))
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(generalLimiter)

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/landing', landingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/notifications', notificationRoutes)
app.use(`/api/${config.ADMIN_ROUTE_HINT}`, adminRoutes)

app.get('/', (req, res) => {
  res.json({
    name: 'Templyn API',
    version: '1.0.0',
    status: 'running',
    docs: '/api'
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: 'المسار غير موجود', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
