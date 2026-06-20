import express, { Router } from 'express'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger, requestLogger } from './lib/logger.js'
import { csrfProtection, csrfTokenMiddleware } from './middleware/csrf.js'

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
import versionRoutes from './modules/versions/versions.routes.js'
import serverRoutes from './modules/servers/servers.routes.js'
import deploymentRoutes from './modules/deployments/deployments.routes.js'
import fieldRoutes from './modules/fields/fields.routes.js'
import assetRoutes from './modules/assets/assets.routes.js'
import reviewRoutes from './modules/reviews/reviews.routes.js'
import projectRoutes from './modules/projects/projects.routes.js'

const app = express()

app.set('trust proxy', 1)

app.use(compression())
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
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}))
const ALLOWED_ORIGINS = [
  config.FRONTEND_URL?.replace(/\/$/, ''),
  'https://huggingface.co',
  'https://moustafa7-flwo.hf.space',
  ...(config.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:5000'] : []),
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.some(a => origin === a || origin.startsWith(a + '/'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(requestLogger())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/api/csrf-token', csrfTokenMiddleware)

if (fs.existsSync('/data/uploads')) {
  app.use('/uploads', express.static('/data/uploads'))
}
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

const previewDir = path.resolve(__dirname, '../uploads/templates-preview')
if (fs.existsSync(previewDir)) {
  app.use('/uploads/templates-preview', express.static(previewDir, { maxAge: 0 }))
}

const clientDist = path.resolve(__dirname, '../../../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  logger.info('Serving React client from %s', clientDist)
} else {
  logger.warn('Client build not found at %s', clientDist)
}

app.use('/api', generalLimiter)

const API_V1 = Router()
API_V1.use('/auth', authRoutes)
API_V1.use('/users', userRoutes)
API_V1.use('/templates', templateRoutes)
API_V1.use('/orders', orderRoutes)
API_V1.use('/chat', chatRoutes)
API_V1.use('/landing', landingRoutes)
API_V1.use('/contact', contactRoutes)
API_V1.use('/notifications', notificationRoutes)
API_V1.use('/templates', versionRoutes)
API_V1.use('/servers', serverRoutes)
API_V1.use('/orders', deploymentRoutes)
API_V1.use('/templates', fieldRoutes)
API_V1.use('/templates', assetRoutes)
API_V1.use('/templates', reviewRoutes)
API_V1.use('/orders', projectRoutes)

import serverPlansRoutes from './modules/serverPlans/serverPlans.routes.js'
API_V1.use('/', serverPlansRoutes)

API_V1.use(`/${config.ADMIN_ROUTE_HINT}`, adminRoutes)

API_V1.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

app.use('/api/v1', API_V1)
app.use('/api', API_V1)

app.use((req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    const indexPath = path.resolve(clientDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
    return res.status(200).send('<h1>DesignFlow</h1><p>Client is being built...</p>')
  }
  res.status(404).json({ success: false, message: 'المسار غير موجود', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
