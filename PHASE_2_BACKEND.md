# DesignFlow — المرحلة الثانية: Backend + PostgreSQL + Security

> **للـ AI المنفذ:** اقرأ هذا الملف كاملاً قبل كتابة أي سطر كود.  
> كل قرار أمني هنا **إلزامي** وليس اختيارياً. ترتيب التنفيذ مهم.  
> لا تبدأ ربط الـ Frontend إلا بعد اختبار كل endpoint بـ Postman/Thunder Client.

---

## 1. إعداد المشروع

```bash
mkdir apps/server && cd apps/server
npm init -y

# Core
npm install express cors helmet cookie-parser express-rate-limit

# Database
npm install prisma @prisma/client
npx prisma init

# Redis
npm install ioredis

# Auth & Security
npm install bcryptjs jsonwebtoken

# Validation
npm install zod

# File Upload
npm install multer
npm install cloudinary multer-storage-cloudinary

# Real-time
npm install socket.io

# Utilities
npm install uuid dotenv morgan compression

# Dev
npm install -D nodemon jest supertest
```

### 1.1 هيكل مجلدات الـ Backend الكامل

```
apps/server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── (auto-generated)
│
├── src/
│   ├── config/
│   │   ├── index.js          ← env validation + config object
│   │   ├── database.js       ← Prisma singleton
│   │   └── redis.js          ← ioredis singleton
│   │
│   ├── middleware/
│   │   ├── auth.js           ← verifyToken, requireRole
│   │   ├── validate.js       ← zod validation wrapper
│   │   ├── rateLimiter.js    ← rate limit factories
│   │   ├── upload.js         ← multer + cloudinary config
│   │   └── errorHandler.js   ← global error handler
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.schema.js
│   │   ├── users/
│   │   │   ├── users.routes.js
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   └── users.schema.js
│   │   ├── templates/
│   │   │   ├── templates.routes.js
│   │   │   ├── templates.controller.js
│   │   │   ├── templates.service.js
│   │   │   └── templates.schema.js
│   │   ├── orders/
│   │   │   ├── orders.routes.js
│   │   │   ├── orders.controller.js
│   │   │   ├── orders.service.js
│   │   │   └── orders.schema.js
│   │   ├── chat/
│   │   │   ├── chat.routes.js
│   │   │   ├── chat.controller.js
│   │   │   ├── chat.service.js
│   │   │   └── chat.gateway.js   ← socket.io handlers
│   │   ├── admin/
│   │   │   ├── admin.routes.js
│   │   │   ├── admin.controller.js
│   │   │   └── admin.service.js
│   │   └── landing/
│   │       ├── landing.routes.js
│   │       ├── landing.controller.js
│   │       └── landing.service.js
│   │
│   ├── lib/
│   │   ├── jwt.js            ← sign/verify helpers
│   │   ├── AppError.js       ← custom error class
│   │   └── pagination.js     ← pagination helper
│   │
│   ├── socket/
│   │   └── index.js          ← socket.io setup
│   │
│   ├── app.js               ← express app (no listen)
│   └── server.js            ← http server + socket + listen
│
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.js
│   │   ├── jwt.test.js
│   │   └── validation.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── templates.test.js
│       ├── orders.test.js
│       └── chat.test.js
│
├── .env
├── .env.example
├── .env.test
├── ecosystem.config.js      ← PM2 config
└── package.json
```

---

## 2. Environment Variables

```env
# apps/server/.env.example

# ===== App =====
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
# CRITICAL: غير المسار ده في الـ production
ADMIN_ROUTE_HINT=x9k2-manage

# ===== Database =====
# Connection string مع PgBouncer في الـ production
DATABASE_URL="postgresql://designflow_user:StrongPassword123!@localhost:5432/designflow_db?schema=public"
# للـ testing: قاعدة منفصلة
DATABASE_URL_TEST="postgresql://designflow_user:StrongPassword123!@localhost:5432/designflow_test?schema=public"

# ===== Redis =====
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""   # فاضي في dev، في production لازم يكون موجود

# ===== JWT =====
# CRITICAL: استخدم openssl rand -base64 64 لتوليد secrets حقيقية
JWT_ACCESS_SECRET="CHANGE_ME_USE_OPENSSL_RAND_64_CHARS_MINIMUM_HERE"
JWT_REFRESH_SECRET="CHANGE_ME_DIFFERENT_FROM_ACCESS_SECRET_HERE"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# ===== Cloudinary =====
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ===== Rate Limiting =====
RATE_LIMIT_WINDOW_MS=900000    # 15 دقيقة
RATE_LIMIT_MAX_GENERAL=100
RATE_LIMIT_MAX_AUTH=5
RATE_LIMIT_MAX_REGISTER=3
```

---

## 3. Config Layer

```javascript
// src/config/index.js
import { z } from 'zod'
import dotenv from 'dotenv'
dotenv.config()

// Validate ENV vars عند الـ startup — تقف التطبيق لو فيه حاجة ناقصة
const envSchema = z.object({
  NODE_ENV:           z.enum(['development', 'production', 'test']).default('development'),
  PORT:               z.string().default('5000').transform(Number),
  CLIENT_URL:         z.string().url(),
  DATABASE_URL:       z.string().url(),
  REDIS_URL:          z.string(),
  JWT_ACCESS_SECRET:  z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES:z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY:    z.string(),
  CLOUDINARY_API_SECRET: z.string(),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
```

```javascript
// src/config/database.js
import { PrismaClient } from '@prisma/client'

// Singleton — لا تعمل instance جديدة في كل request
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// اختبار الاتصال
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected')
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  }
}
```

```javascript
// src/config/redis.js
import Redis from 'ioredis'
import { config } from './index.js'

export const redis = new Redis(config.REDIS_URL, {
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),  // retry مع backoff
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('❌ Redis error:', err))
```

---

## 4. Prisma Schema الكامل

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ════════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════════

enum Role {
  CLIENT
  SUPPORT
  ADMIN
}

enum OrderStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ════════════════════════════════════════════
// MODELS
// ════════════════════════════════════════════

model User {
  id           String   @id @default(cuid())
  firstName    String   @db.VarChar(50)
  lastName     String   @db.VarChar(50)
  phone        String   @unique @db.VarChar(20)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @db.Text
  avatarUrl    String?  @db.Text
  role         Role     @default(CLIENT)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  orders        Order[]
  sentMessages  Message[]    @relation("SentMessages")
  refreshTokens RefreshToken[]

  @@index([email])
  @@index([phone])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique @db.Text      // hashed token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])          // لحذف المنتهية تلقائياً
  @@map("refresh_tokens")
}

model Template {
  id            String   @id @default(cuid())
  title         String   @db.VarChar(100)
  description   String   @db.Text
  category      String   @db.VarChar(50)
  price         Decimal  @db.Decimal(10, 2)
  previewUrl    String   @db.Text
  demoUrl       String?  @db.Text
  tags          String[]
  isPublished   Boolean  @default(false)
  defaultColors Json     // { primary, secondary, accent, text }
  components    Json     // { sections: [...], colorBindings: {...} }
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders Order[]

  @@index([isPublished])
  @@index([category])
  @@index([sortOrder])
  @@map("templates")
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  templateId    String
  template      Template    @relation(fields: [templateId], references: [id])
  status        OrderStatus @default(PENDING)
  customization Json        // { sections: [...], colorTokens: {...} }
  totalAmount   Decimal     @db.Decimal(10, 2)
  notes         String?     @db.Text
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  conversation Conversation?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model Conversation {
  id        String   @id @default(cuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  isOpen    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages Message[]

  @@map("conversations")
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation("SentMessages", fields: [senderId], references: [id])
  content        String       @db.Text
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())

  @@index([conversationId])
  @@index([createdAt])
  @@index([isRead])
  @@map("messages")
}

model LandingContent {
  id        String   @id @default(cuid())
  section   String   @unique @db.VarChar(50)    // "hero", "features", etc.
  content   Json
  updatedAt DateTime @updatedAt

  @@map("landing_content")
}
```

### 4.1 Migration & Seed

```bash
# إنشاء migration
npx prisma migrate dev --name init

# توليد Prisma Client
npx prisma generate

# Seed (إنشاء أدمن أولي + landing content)
npx prisma db seed
```

```javascript
// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const hashedPass = await bcrypt.hash('Admin@123456', 12)
  await prisma.user.upsert({
    where: { email: 'admin@designflow.com' },
    update: {},
    create: {
      firstName:    'Admin',
      lastName:     'System',
      phone:        '+201000000000',
      email:        'admin@designflow.com',
      passwordHash: hashedPass,
      role:         'ADMIN',
    }
  })

  // Default landing content
  const sections = ['hero', 'features', 'how_it_works', 'testimonials', 'footer']
  for (const section of sections) {
    await prisma.landingContent.upsert({
      where: { section },
      update: {},
      create: { section, content: getDefaultContent(section) }
    })
  }

  console.log('✅ Seed completed')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

---

## 5. Security Layer — كل الـ Middleware

### 5.1 AppError Class

```javascript
// src/lib/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// استخدام موحد في كل مكان:
// throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
// throw new AppError('البيانات غير صحيحة', 400, 'VALIDATION_ERROR')
// throw new AppError('غير مصرح', 401, 'UNAUTHORIZED')
// throw new AppError('ممنوع الوصول', 403, 'FORBIDDEN')
```

### 5.2 Global Error Handler

```javascript
// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  // Log non-operational errors (programming bugs)
  if (!err.isOperational) {
    console.error('💥 CRITICAL ERROR:', err)
    // في production: أرسل لـ Sentry/DataDog
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'هذا البريد أو رقم الهاتف مستخدم بالفعل', code: 'DUPLICATE_ENTRY' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'العنصر غير موجود', code: 'NOT_FOUND' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'رمز المصادقة غير صحيح', code: 'INVALID_TOKEN' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة', code: 'TOKEN_EXPIRED' })
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'بيانات غير صحيحة', code: 'VALIDATION_ERROR', details: err.flatten() })
  }

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code })
  }

  // Unknown errors — لا تكشف التفاصيل
  return res.status(500).json({ error: 'حدث خطأ داخلي', code: 'INTERNAL_ERROR' })
}
```

### 5.3 Auth Middleware

```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { redis } from '../config/redis.js'
import { AppError } from '../lib/AppError.js'
import { prisma } from '../config/database.js'

export async function authenticate(req, res, next) {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('لم يتم توفير رمز المصادقة', 401, 'NO_TOKEN')
    }
    const token = authHeader.split(' ')[1]

    // 2. Check blacklist (Redis) — للـ tokens المُبطلة بعد logout
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) throw new AppError('رمز المصادقة ملغي', 401, 'TOKEN_REVOKED')

    // 3. Verify JWT
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET)

    // 4. Check user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, isActive: true, email: true, firstName: true, lastName: true }
    })

    if (!user || !user.isActive) {
      throw new AppError('المستخدم غير موجود أو محظور', 401, 'USER_NOT_FOUND')
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

// Role-based access
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('غير مصادق', 401, 'UNAUTHORIZED'))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN'))
    }
    next()
  }
}

// Shortcuts
export const requireAdmin   = requireRole('ADMIN')
export const requireSupport = requireRole('ADMIN', 'SUPPORT')
```

### 5.4 Validation Middleware

```javascript
// src/middleware/validate.js
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body
               : source === 'params' ? req.params
               : req.query

    const result = schema.safeParse(data)
    if (!result.success) {
      return res.status(400).json({
        error: 'بيانات غير صحيحة',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors
      })
    }
    req.validatedData = result.data
    next()
  }
}
```

### 5.5 Rate Limiters

```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../config/redis.js'

const makeStore = (prefix) => new RedisStore({
  prefix: `rl:${prefix}:`,
  sendCommand: (...args) => redis.call(...args),
})

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: makeStore('general'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'عدد كبير جداً من الطلبات، حاول بعد 15 دقيقة', code: 'RATE_LIMIT_EXCEEDED' }
})

// Auth endpoints — أشد تقييداً
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                         // 5 محاولات login فقط
  store: makeStore('login'),
  skipSuccessfulRequests: true,   // لا يحسب الـ successful logins
  message: { error: 'تجاوزت الحد المسموح، حاول بعد 15 دقيقة', code: 'TOO_MANY_LOGIN_ATTEMPTS' }
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,      // ساعة
  max: 3,
  store: makeStore('register'),
  message: { error: 'حد التسجيل، حاول بعد ساعة', code: 'TOO_MANY_REGISTRATIONS' }
})

// Upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  store: makeStore('upload'),
  message: { error: 'حد الرفع، حاول بعد ساعة', code: 'UPLOAD_RATE_LIMIT' }
})
```

### 5.6 Upload Middleware

```javascript
// src/middleware/upload.js
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { config } from '../config/index.js'
import { AppError } from '../lib/AppError.js'

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key:    config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB

function makeCloudinaryStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: { folder: `designflow/${folder}`, allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
  })
}

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('نوع الملف غير مسموح (فقط JPEG, PNG, WebP)', 400, 'INVALID_FILE_TYPE'))
  }
}

export const uploadAvatar = multer({
  storage: makeCloudinaryStorage('avatars'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('avatar')

export const uploadTemplateImage = multer({
  storage: makeCloudinaryStorage('templates'),
  limits: { fileSize: MAX_FILE_SIZE * 2 },  // 10MB للقوالب
  fileFilter,
}).single('preview')
```

---

## 6. JWT Service

```javascript
// src/lib/jwt.js
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { redis } from '../config/redis.js'

export function signAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role, type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES }
  )
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET)
}

// Blacklist access token عند الـ logout
export async function blacklistToken(token) {
  const decoded = jwt.decode(token)
  if (!decoded?.exp) return
  const ttl = decoded.exp - Math.floor(Date.now() / 1000)
  if (ttl > 0) await redis.setex(`blacklist:${token}`, ttl, '1')
}

// Socket.IO auth
export async function verifySocketToken(token) {
  try {
    const decoded = verifyAccessToken(token)
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) return null
    return decoded
  } catch {
    return null
  }
}
```

---

## 7. Auth Module الكامل

### 7.1 Schemas

```javascript
// src/modules/auth/auth.schema.js
import { z } from 'zod'

export const registerSchema = z.object({
  firstName:       z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح'),
  lastName:        z.string().min(2).max(50).regex(/^[\p{L}\s]+$/u, 'اسم غير صحيح'),
  phone:           z.string().regex(/^\+?[0-9]{10,15}$/, 'رقم هاتف غير صحيح'),
  email:           z.string().email('بريد إلكتروني غير صحيح').toLowerCase(),
  password:        z.string()
                    .min(8, 'كلمة المرور 8 أحرف على الأقل')
                    .regex(/^(?=.*[A-Z])/, 'يجب أن تحتوي على حرف كبير')
                    .regex(/^(?=.*[0-9])/, 'يجب أن تحتوي على رقم')
                    .regex(/^(?=.*[^A-Za-z0-9])/, 'يجب أن تحتوي على رمز خاص'),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirmPassword']
})

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8)
                    .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/)
})
```

### 7.2 Service

```javascript
// src/modules/auth/auth.service.js
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../config/database.js'
import { redis } from '../../config/redis.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, blacklistToken } from '../../lib/jwt.js'
import { AppError } from '../../lib/AppError.js'

const BCRYPT_ROUNDS = 12
const REFRESH_TOKEN_EXPIRES_DAYS = 7

export async function registerUser(data, avatarUrl = null) {
  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] }
  })
  if (existing) {
    const field = existing.email === data.email ? 'البريد الإلكتروني' : 'رقم الهاتف'
    throw new AppError(`${field} مستخدم بالفعل`, 409, 'DUPLICATE_ENTRY')
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName:  data.lastName,
      phone:     data.phone,
      email:     data.email,
      passwordHash,
      avatarUrl,
      role: 'CLIENT'
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true }
  })

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  return { user, accessToken, refreshToken }
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true, passwordHash: true, isActive: true }
  })

  // SECURITY: نفس الـ error message للـ user غير الموجود والـ password الغلط
  // منع User Enumeration attacks
  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.hash(password, 1)
  if (!user || !isValid) throw new AppError('بيانات تسجيل الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
  if (!user.isActive) throw new AppError('الحساب موقوف، تواصل مع الدعم', 403, 'ACCOUNT_SUSPENDED')

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  const { passwordHash, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export async function refreshUserToken(oldRefreshToken) {
  if (!oldRefreshToken) throw new AppError('لم يتم توفير refresh token', 401, 'NO_REFRESH_TOKEN')

  // Verify the JWT
  let decoded
  try { decoded = verifyRefreshToken(oldRefreshToken) }
  catch { throw new AppError('Refresh token منتهي أو غير صحيح', 401, 'INVALID_REFRESH_TOKEN') }

  // Check exists in DB (rotation: كل refresh → delete old, create new)
  const hashedOld = await hashToken(oldRefreshToken)
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashedOld } })
  if (!stored || stored.expiresAt < new Date()) {
    // Possible token reuse attack — revoke all user tokens
    await prisma.refreshToken.deleteMany({ where: { userId: decoded.sub } })
    throw new AppError('Refresh token غير صحيح', 401, 'REFRESH_TOKEN_REUSE')
  }

  // Delete old, create new (rotation)
  await prisma.refreshToken.delete({ where: { token: hashedOld } })

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true, isActive: true }
  })
  if (!user || !user.isActive) throw new AppError('المستخدم غير موجود', 401, 'USER_NOT_FOUND')

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  return { user, accessToken, refreshToken }
}

export async function logoutUser(userId, accessToken) {
  // Blacklist current access token
  if (accessToken) await blacklistToken(accessToken)

  // Delete all refresh tokens for this user
  await prisma.refreshToken.deleteMany({ where: { userId } })
}

// ─── Helpers ───
async function createTokenPair(userId, role) {
  const accessToken  = signAccessToken(userId, role)
  const refreshToken = signRefreshToken(userId)

  const hashedRefresh = await hashToken(refreshToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: { token: hashedRefresh, userId, expiresAt }
  })

  return { accessToken, refreshToken }
}

async function hashToken(token) {
  // Hash the refresh token before storing (bcrypt مش ضروري هنا، sha256 كافي)
  const { createHash } = await import('crypto')
  return createHash('sha256').update(token).digest('hex')
}
```

### 7.3 Controller

```javascript
// src/modules/auth/auth.controller.js
import * as authService from './auth.service.js'
import { uploadAvatar } from '../../middleware/upload.js'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days
  path:     '/api/auth/refresh'         // Scope محدود للكوكي
}

export async function register(req, res, next) {
  try {
    const avatarUrl = req.file?.path || null
    const { user, accessToken, refreshToken } = await authService.registerUser(req.validatedData, avatarUrl)

    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.status(201).json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedData
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password)

    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function refresh(req, res, next) {
  try {
    const oldToken = req.cookies.refresh_token
    const { user, accessToken, refreshToken } = await authService.refreshUserToken(oldToken)

    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function logout(req, res, next) {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1]
    await authService.logoutUser(req.user.id, accessToken)

    res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
    res.json({ message: 'تم تسجيل الخروج بنجاح' })
  } catch (err) { next(err) }
}

export async function getMe(req, res) {
  res.json(req.user)
}
```

### 7.4 Routes

```javascript
// src/modules/auth/auth.routes.js
import { Router } from 'express'
import { uploadAvatar } from '../../middleware/upload.js'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/auth.js'
import { loginLimiter, registerLimiter } from '../../middleware/rateLimiter.js'
import { registerSchema, loginSchema } from './auth.schema.js'
import * as ctrl from './auth.controller.js'

const router = Router()

router.post('/register', registerLimiter, uploadAvatar, validate(registerSchema), ctrl.register)
router.post('/login',    loginLimiter,    validate(loginSchema), ctrl.login)
router.post('/refresh',  ctrl.refresh)
router.post('/logout',   authenticate, ctrl.logout)
router.get('/me',        authenticate, ctrl.getMe)

export default router
```

---

## 8. Templates Module

### 8.1 Service (مع Redis Caching)

```javascript
// src/modules/templates/templates.service.js
import { prisma } from '../../config/database.js'
import { redis } from '../../config/redis.js'
import { AppError } from '../../lib/AppError.js'

const CACHE_TTL = 300  // 5 دقائق
const CACHE_PREFIX = 'templates:'

export async function getPublishedTemplates({ category, search, page = 1, limit = 12 }) {
  const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify({ category, search, page, limit })}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const where = {
    isPublished: true,
    ...(category && { category }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      select: {
        id: true, title: true, description: true, category: true,
        price: true, previewUrl: true, tags: true, defaultColors: true
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.template.count({ where })
  ])

  const result = { templates, total, page, totalPages: Math.ceil(total / limit) }
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))
  return result
}

export async function getTemplateById(id) {
  const cacheKey = `${CACHE_PREFIX}${id}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const template = await prisma.template.findUnique({
    where: { id, isPublished: true },
    select: {
      id: true, title: true, description: true, category: true,
      price: true, previewUrl: true, demoUrl: true, tags: true,
      defaultColors: true, components: true
    }
  })

  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(template))
  return template
}

// Invalidate cache عند أي تعديل
export async function invalidateTemplateCache(id = null) {
  if (id) await redis.del(`${CACHE_PREFIX}${id}`)
  // Delete all list caches (pattern delete)
  const keys = await redis.keys(`${CACHE_PREFIX}list:*`)
  if (keys.length) await redis.del(...keys)
}
```

---

## 9. Orders Module

```javascript
// src/modules/orders/orders.service.js
import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { createConversationWithWelcome } from '../chat/chat.service.js'
import { v4 as uuidv4 } from 'uuid'

export async function createOrder(userId, { templateId, customization, notes }) {
  // Verify template exists
  const template = await prisma.template.findUnique({
    where: { id: templateId, isPublished: true },
    select: { id: true, price: true, title: true }
  })
  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  const order = await prisma.order.create({
    data: {
      orderNumber:   `ORD-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`,
      userId,
      templateId,
      customization,
      totalAmount:   template.price,
      notes,
      status:        'PENDING'
    },
    include: { template: { select: { title: true, previewUrl: true } } }
  })

  return order
}

export async function getUserOrders(userId, { page = 1, limit = 10, status }) {
  const where = { userId, ...(status && { status }) }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        template: { select: { title: true, previewUrl: true, category: true } },
        conversation: { select: { id: true, isOpen: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where })
  ])
  return { orders, total, totalPages: Math.ceil(total / limit) }
}

// Admin: تغيير حالة الطلب
export async function updateOrderStatus(orderId, newStatus, adminId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { conversation: true }
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')

  const updated = await prisma.order.update({
    where: { id: orderId },
    data:  { status: newStatus }
  })

  // لما الطلب يتقبل → رسالة تلقائية للعميل
  if (newStatus === 'ACCEPTED') {
    await createConversationWithWelcome(orderId, order.userId, adminId)
  }

  return updated
}
```

---

## 10. Chat Module + Socket.IO

### 10.1 Chat Service

```javascript
// src/modules/chat/chat.service.js
import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function createConversationWithWelcome(orderId, clientId, adminId) {
  // لو موجودة بالفعل → return existing
  const existing = await prisma.conversation.findUnique({ where: { orderId } })
  if (existing) return existing

  const conversation = await prisma.conversation.create({
    data: {
      orderId,
      isOpen: true,
      messages: {
        create: {
          senderId: adminId,
          content:  'مرحباً! تم قبول طلبك وسيتواصل معك فريقنا قريباً لمناقشة التفاصيل. 🎉',
        }
      }
    },
    include: { messages: true }
  })

  return conversation
}

export async function getConversationMessages(conversationId, userId, userRole, { cursor, limit = 20 }) {
  // Verify access
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { order: { select: { userId: true } } }
  })
  if (!conv) throw new AppError('المحادثة غير موجودة', 404, 'CONVERSATION_NOT_FOUND')

  const isAdmin = ['ADMIN', 'SUPPORT'].includes(userRole)
  if (!isAdmin && conv.order.userId !== userId) {
    throw new AppError('ليس لديك صلاحية الوصول لهذه المحادثة', 403, 'FORBIDDEN')
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true, role: true } } },
    orderBy: { createdAt: 'asc' },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 })
  })

  return messages
}

export async function saveMessage(conversationId, senderId, content) {
  // Verify conversation is open
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv?.isOpen) throw new AppError('المحادثة مغلقة', 403, 'CONVERSATION_CLOSED')

  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
    include: { sender: { select: { firstName: true, lastName: true, avatarUrl: true, role: true } } }
  })

  return message
}
```

### 10.2 Socket.IO Gateway

```javascript
// src/modules/chat/chat.gateway.js
import { verifySocketToken } from '../../lib/jwt.js'
import { prisma } from '../../config/database.js'
import { saveMessage } from './chat.service.js'

export function setupChatGateway(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    const decoded = await verifySocketToken(token)
    if (!decoded) return next(new Error('Unauthorized'))

    // Attach user to socket
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true }
    })
    if (!user) return next(new Error('User not found'))

    socket.user = user
    next()
  })

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.id}`)

    // Join personal room
    socket.join(`user:${socket.user.id}`)

    socket.on('join_conversation', async (conversationId) => {
      // Verify access before joining room
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { order: { select: { userId: true } } }
        })
        if (!conv) return

        const isAdmin = ['ADMIN', 'SUPPORT'].includes(socket.user.role)
        const isOwner = conv.order.userId === socket.user.id

        if (isAdmin || isOwner) {
          socket.join(`conv:${conversationId}`)
          socket.emit('joined_conversation', { conversationId })
        }
      } catch (err) {
        socket.emit('error', { message: 'خطأ في الانضمام للمحادثة' })
      }
    })

    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        // Input validation
        if (!content?.trim() || content.length > 2000) {
          return socket.emit('error', { message: 'رسالة غير صحيحة' })
        }

        const message = await saveMessage(conversationId, socket.user.id, content.trim())

        // Emit to all in the conversation room
        io.to(`conv:${conversationId}`).emit('new_message', message)

        // Notify the other party (push notification style)
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { order: { select: { userId: true } } }
        })
        const targetUserId = socket.user.role === 'CLIENT' ? null : conv?.order.userId
        if (targetUserId) {
          io.to(`user:${targetUserId}`).emit('message_notification', {
            conversationId,
            senderName: `${socket.user.firstName} ${socket.user.lastName}`,
            preview: content.slice(0, 50)
          })
        }
      } catch (err) {
        socket.emit('error', { message: err.message })
      }
    })

    socket.on('mark_read', async ({ conversationId }) => {
      await prisma.message.updateMany({
        where: { conversationId, isRead: false, senderId: { not: socket.user.id } },
        data:  { isRead: true }
      })
      io.to(`conv:${conversationId}`).emit('messages_read', { conversationId, readBy: socket.user.id })
    })

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.id}`)
    })
  })
}
```

---

## 11. App.js + Server.js

```javascript
// src/app.js
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import morgan from 'morgan'
import { config } from './config/index.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'

// Routes
import authRoutes      from './modules/auth/auth.routes.js'
import usersRoutes     from './modules/users/users.routes.js'
import templatesRoutes from './modules/templates/templates.routes.js'
import ordersRoutes    from './modules/orders/orders.routes.js'
import chatRoutes      from './modules/chat/chat.routes.js'
import adminRoutes     from './modules/admin/admin.routes.js'
import landingRoutes   from './modules/landing/landing.routes.js'

const app = express()

// ─── Security Headers ───────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
      connectSrc: ["'self'", config.CLIENT_URL],
    }
  }
}))

// ─── CORS ────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [config.CLIENT_URL, 'http://localhost:5173']
    if (!origin || allowed.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))        // منع large JSON payloads
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(compression())

// ─── Logging ─────────────────────────────────────────────
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'))
}

// ─── Rate Limiting ───────────────────────────────────────
app.use('/api', generalLimiter)

// ─── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/users',     usersRoutes)
app.use('/api/templates', templatesRoutes)
app.use('/api/orders',    ordersRoutes)
app.use('/api/chat',      chatRoutes)
app.use('/api/admin',     adminRoutes)
app.use('/api/landing',   landingRoutes)

// ─── 404 Handler ─────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'المسار غير موجود', code: 'ROUTE_NOT_FOUND' })
})

// ─── Global Error Handler (MUST be last) ─────────────────
app.use(errorHandler)

export default app
```

```javascript
// src/server.js
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import app from './app.js'
import { connectDB } from './config/database.js'
import { redis } from './config/redis.js'
import { setupChatGateway } from './modules/chat/chat.gateway.js'
import { config } from './config/index.js'

async function bootstrap() {
  // Connect DB
  await connectDB()

  // Create HTTP server
  const httpServer = createServer(app)

  // Setup Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: { origin: config.CLIENT_URL, credentials: true },
    transports: ['websocket', 'polling'],
  })
  setupChatGateway(io)

  // Start server
  httpServer.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`)
    console.log(`🌍 Environment: ${config.NODE_ENV}`)
  })

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`)
    httpServer.close(async () => {
      await prisma.$disconnect()
      await redis.quit()
      console.log('✅ Server closed.')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000)  // Force exit after 10s
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  // Unhandled rejections
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason)
    shutdown('UNHANDLED_REJECTION')
  })
}

bootstrap()
```

---

## 12. Admin Routes الكاملة

```javascript
// src/modules/admin/admin.routes.js
import { Router } from 'express'
import { authenticate, requireSupport, requireAdmin } from '../../middleware/auth.js'
import * as ctrl from './admin.controller.js'

const router = Router()

// كل الـ admin routes محمية بـ authenticate + requireSupport/requireAdmin
router.use(authenticate)

// Overview
router.get('/stats', requireAdmin, ctrl.getStats)

// Orders
router.get('/orders',                   requireSupport, ctrl.getAllOrders)
router.get('/orders/:id',               requireSupport, ctrl.getOrderById)
router.patch('/orders/:id/status',      requireSupport, ctrl.updateOrderStatus)
router.post('/orders/:id/conversation', requireSupport, ctrl.openConversation)

// Templates (Admin only — مش Support)
router.get('/templates',                requireAdmin, ctrl.getAllTemplates)
router.post('/templates',               requireAdmin, uploadTemplateImage, ctrl.createTemplate)
router.put('/templates/:id',            requireAdmin, ctrl.updateTemplate)
router.delete('/templates/:id',         requireAdmin, ctrl.deleteTemplate)
router.patch('/templates/:id/publish',  requireAdmin, ctrl.togglePublish)

// Landing Content
router.get('/landing',            requireAdmin, ctrl.getLandingContent)
router.put('/landing/:section',   requireAdmin, ctrl.updateLandingSection)

// Users
router.get('/users',      requireAdmin, ctrl.getUsers)
router.get('/users/:id',  requireAdmin, ctrl.getUserById)

// Conversations
router.get('/conversations', requireSupport, ctrl.getConversations)

export default router
```

---

## 13. PostgreSQL Performance

### 13.1 Connection Pooling

```javascript
// DATABASE_URL مع PgBouncer في الـ production:
// postgresql://user:pass@pgbouncer:6432/designflow?pgbouncer=true&connection_limit=5

// أو باستخدام Prisma's built-in pooling:
// DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### 13.2 Indexes Strategy

```sql
-- الـ indexes الموجودة في الـ schema كافية للـ queries العادية
-- لكن في الـ production راجع slow query log وأضف indexes حسب الحاجة

-- مثال: لو بتـquery orders بـ userId + status كتير:
-- هو موجود بالفعل في الـ schema كـ @@index([userId]) و @@index([status])

-- لـ full-text search على الـ templates:
CREATE INDEX idx_templates_search ON templates USING gin(to_tsvector('english', title || ' ' || description));

-- EXPLAIN ANALYZE لكل query تاقل في الـ production
```

### 13.3 Cron: Cleanup Expired Tokens

```javascript
// src/jobs/cleanup.js — بيشتغل يومياً
import { prisma } from '../config/database.js'

export async function cleanupExpiredTokens() {
  const deleted = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  })
  console.log(`🧹 Deleted ${deleted.count} expired refresh tokens`)
}

// في server.js، اشتغل كل 24 ساعة:
// setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000)
```

---

## 14. PM2 Production Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name:      'designflow-api',
    script:    'src/server.js',
    instances: 'max',             // استخدم كل الـ CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    error_file:  'logs/error.log',
    out_file:    'logs/out.log',
    merge_logs:  true,
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    // Auto restart on crash
    autorestart:    true,
    watch:          false,
    restart_delay:  5000,
  }]
}
```

---

## 15. Nginx Config (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/designflow

upstream api_backend {
    least_conn;                    # Load balance بين PM2 instances
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.designflow.com;

    ssl_certificate     /etc/ssl/certs/designflow.crt;
    ssl_certificate_key /etc/ssl/private/designflow.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers (backup لـ helmet)
    add_header X-Frame-Options       "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy       "strict-origin-when-cross-origin";

    # Rate limiting على مستوى Nginx (قبل ما يوصل Express)
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req zone=api burst=20 nodelay;

    location /api {
        proxy_pass         http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout    60s;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass         http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }

    # Static files (Frontend build)
    location / {
        root /var/www/designflow/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name designflow.com api.designflow.com;
    return 301 https://$host$request_uri;
}
```

---

## 16. Security Audit Checklist

### Authentication
- [ ] Passwords hashed بـ bcrypt (rounds=12)
- [ ] JWT secrets عشوائية وطويلة (64+ chars)
- [ ] Access tokens قصيرة العمر (15 دقيقة)
- [ ] Refresh tokens في httpOnly cookies فقط
- [ ] Refresh token rotation بعد كل استخدام
- [ ] Token blacklisting عند الـ logout
- [ ] User enumeration protection (نفس الـ error لـ user غير موجود + password غلط)
- [ ] Account lockout عند محاولات كثيرة

### Input Validation
- [ ] Zod validation على كل request body
- [ ] File type validation (MIME check + extension)
- [ ] File size limits
- [ ] JSON size limit (10kb)
- [ ] SQL Injection: Prisma parameterized queries
- [ ] XSS Prevention: helmet + content validation

### Authorization
- [ ] كل route محمي بـ authenticate middleware
- [ ] Role-based access control (CLIENT / SUPPORT / ADMIN)
- [ ] Resource ownership checks (العميل يشوف طلباته بس)
- [ ] Admin routes مخفية (404 للغير مصرح)

### Infrastructure
- [ ] HTTPS في الـ production
- [ ] Rate limiting على كل endpoint حساس
- [ ] CORS محدود بـ allowed origins فقط
- [ ] Helmet headers
- [ ] Compression
- [ ] Graceful shutdown
- [ ] Error messages لا تكشف stack traces في الـ production
- [ ] Logs لا تحتوي على passwords أو tokens

---

## 17. Checklist قبل إنهاء المرحلة

- [ ] كل الـ endpoints شغالة بـ Postman/Thunder Client
- [ ] Auth flow كامل (register → login → refresh → logout)
- [ ] Template CRUD + cache
- [ ] Order creation + status update + auto-conversation
- [ ] Socket.IO chat (من admin → client وعكسه)
- [ ] Rate limiting شغال (اختبر بـ 10+ requests متتاليين)
- [ ] JWT blacklisting بعد logout
- [ ] File upload يشتغل على Cloudinary
- [ ] Error handler بيمسك كل الأخطاء
- [ ] Prisma migrations applied
- [ ] PM2 cluster mode شغال
- [ ] /health endpoint بيرجع 200

---

*المرحلة الثانية منتهية — انتقل لـ PHASE_3_TESTING.md*
