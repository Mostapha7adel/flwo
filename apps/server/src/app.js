import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
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

app.set('trust proxy', 1)

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
      frameAncestors: ["'self'", "https://huggingface.co", "https://*.hf.space"],
    },
  },
}))
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      config.FRONTEND_URL,
      'https://huggingface.co',
      ...(config.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
    ].filter(Boolean)
    if (!origin || allowed.some(a => origin.startsWith(a.replace(/\/$/, '')) || origin.includes('.hf.space'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (fs.existsSync('/data/uploads')) {
  app.use('/uploads', express.static('/data/uploads'))
}
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

const clientDist = path.resolve(__dirname, '../../../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  console.log('✅ Serving React client from', clientDist)
} else {
  console.warn('⚠️  Client build not found at', clientDist)
}

app.use('/api', generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/landing', landingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/notifications', notificationRoutes)
app.use(`/api/${config.ADMIN_ROUTE_HINT}`, adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    const indexPath = path.resolve(clientDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
    return res.status(200).send('<h1>DesignFlow</h1><p>Client is being built...</p>')
  }
  res.status(404).json({ error: 'المسار غير موجود', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
