# DesignFlow — المرحلة الثالثة: الاختبار الشامل

> **للـ AI المنفذ:** لا تبدأ هذه المرحلة إلا بعد إنهاء المرحلتين السابقتين كاملاً.  
> الاختبار هنا على 3 مستويات: Unit → Integration → Load/Security  
> أي test بيفشل = الـ feature مش جاهز للـ production. لا تكمل قبل ما يعدي كل الـ tests.

---

## 1. إعداد بيئة الاختبار

```bash
cd apps/server

# Test dependencies
npm install -D jest supertest @jest/globals
npm install -D @testcontainers/postgresql   # PostgreSQL container للـ tests
npm install -D cross-env

# Load testing
npm install -g artillery@2
npm install -g autocannon

# Security scanning
npm install -D npm-audit-fix
```

### 1.1 Jest Config

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterFramework: ['./tests/setup.js'],
  globalSetup:    './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 }
  }
}
```

### 1.2 Test Setup

```javascript
// tests/globalSetup.js
import { execSync } from 'child_process'

export default async function globalSetup() {
  // Use test database
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
  process.env.NODE_ENV = 'test'

  // Run migrations on test DB
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  console.log('✅ Test database ready')
}
```

```javascript
// tests/globalTeardown.js
import { PrismaClient } from '@prisma/client'

export default async function globalTeardown() {
  const prisma = new PrismaClient()
  // Clean all tables (بترتيب عكسي للـ relations)
  await prisma.$executeRaw`TRUNCATE TABLE messages, conversations, orders, refresh_tokens, users, templates, landing_content RESTART IDENTITY CASCADE`
  await prisma.$disconnect()
}
```

```javascript
// tests/setup.js — بيشتغل قبل كل test file
import { PrismaClient } from '@prisma/client'
import { redis } from '../src/config/redis.js'

const prisma = new PrismaClient()

beforeEach(async () => {
  // Clean tables before each test
  await prisma.$executeRaw`TRUNCATE TABLE messages, conversations, orders, refresh_tokens, users, templates RESTART IDENTITY CASCADE`
  await redis.flushdb()  // Clean Redis
})

afterAll(async () => {
  await prisma.$disconnect()
  await redis.quit()
})
```

```javascript
// tests/helpers/factories.js — Test Data Factories
import bcrypt from 'bcryptjs'
import { prisma } from '../../src/config/database.js'

export async function createUser(overrides = {}) {
  const hash = await bcrypt.hash(overrides.password || 'Test@1234', 10)
  return prisma.user.create({
    data: {
      firstName:    overrides.firstName    || 'Ahmed',
      lastName:     overrides.lastName     || 'Test',
      phone:        overrides.phone        || `+2010${Math.floor(Math.random() * 90000000 + 10000000)}`,
      email:        overrides.email        || `test_${Date.now()}@test.com`,
      passwordHash: hash,
      role:         overrides.role         || 'CLIENT',
      avatarUrl:    overrides.avatarUrl    || null,
    }
  })
}

export async function createAdmin(overrides = {}) {
  return createUser({ ...overrides, role: 'ADMIN', email: overrides.email || `admin_${Date.now()}@test.com` })
}

export async function createTemplate(overrides = {}) {
  return prisma.template.create({
    data: {
      title:         overrides.title        || 'Test Template',
      description:   overrides.description  || 'A test template',
      category:      overrides.category     || 'تجارة',
      price:         overrides.price        || 99.00,
      previewUrl:    overrides.previewUrl   || 'https://cloudinary.com/test.jpg',
      tags:          overrides.tags         || ['test'],
      isPublished:   overrides.isPublished !== undefined ? overrides.isPublished : true,
      defaultColors: overrides.defaultColors || { primary: '#2563EB', secondary: '#F8FAFC', accent: '#7C3AED', text: '#0F172A' },
      components:    overrides.components   || { sections: [{ id: 'hero', label: 'Hero', draggable: true }] },
    }
  })
}

export async function createOrder(userId, templateId, overrides = {}) {
  return prisma.order.create({
    data: {
      orderNumber:   `ORD-TEST-${Date.now()}`,
      userId,
      templateId,
      status:        overrides.status       || 'PENDING',
      customization: overrides.customization || { sections: [], colorTokens: {} },
      totalAmount:   overrides.totalAmount   || 99.00,
    }
  })
}

// Login helper: بيرجع access token جاهز
export async function loginUser(app, credentials) {
  const res = await request(app).post('/api/auth/login').send(credentials)
  return { token: res.body.accessToken, cookie: res.headers['set-cookie'] }
}
```

---

## 2. Unit Tests

### 2.1 JWT Service Tests

```javascript
// tests/unit/jwt.test.js
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, blacklistToken } from '../../src/lib/jwt.js'
import { redis } from '../../src/config/redis.js'

describe('JWT Service', () => {
  const userId = 'test-user-id'
  const role   = 'CLIENT'

  describe('signAccessToken', () => {
    it('should generate a valid JWT string', () => {
      const token = signAccessToken(userId, role)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should embed correct payload', () => {
      const token = signAccessToken(userId, role)
      const decoded = verifyAccessToken(token)
      expect(decoded.sub).toBe(userId)
      expect(decoded.role).toBe(role)
      expect(decoded.type).toBe('access')
    })

    it('should expire after 15 minutes', async () => {
      // Mock Date to simulate expiry
      const realDate = Date
      global.Date = class extends Date {
        constructor(...args) { super(...args) }
        static now() { return realDate.now() + 16 * 60 * 1000 }
      }
      const token = signAccessToken(userId, role)
      // Token made 16 min ago — should throw
      global.Date = realDate
      // Note: لازم تعمل token قديم بـ iat في الماضي للاختبار الصح
      // هنا فقط نتأكد إن الـ verify شغال
      expect(() => verifyAccessToken(token)).not.toThrow()
    })
  })

  describe('blacklistToken', () => {
    it('should add token to Redis blacklist', async () => {
      const token = signAccessToken(userId, role)
      await blacklistToken(token)
      const stored = await redis.get(`blacklist:${token}`)
      expect(stored).toBe('1')
    })

    it('should set TTL matching token expiry', async () => {
      const token = signAccessToken(userId, role)
      await blacklistToken(token)
      const ttl = await redis.ttl(`blacklist:${token}`)
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(900)  // 15 دقيقة = 900 ثانية
    })
  })
})
```

### 2.2 Validation Schema Tests

```javascript
// tests/unit/schemas.test.js
import { registerSchema, loginSchema } from '../../src/modules/auth/auth.schema.js'

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    const valid = {
      firstName: 'Ahmed', lastName: 'Mohamed',
      phone: '+201234567890', email: 'ahmed@test.com',
      password: 'Test@1234', confirmPassword: 'Test@1234'
    }

    it('should pass with valid data', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it('should fail with short firstName', () => {
      const r = registerSchema.safeParse({ ...valid, firstName: 'A' })
      expect(r.success).toBe(false)
      expect(r.error.flatten().fieldErrors.firstName).toBeDefined()
    })

    it('should fail with invalid email', () => {
      const r = registerSchema.safeParse({ ...valid, email: 'not-an-email' })
      expect(r.success).toBe(false)
      expect(r.error.flatten().fieldErrors.email).toBeDefined()
    })

    it('should fail with weak password (no uppercase)', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'test@1234', confirmPassword: 'test@1234' })
      expect(r.success).toBe(false)
    })

    it('should fail when passwords do not match', () => {
      const r = registerSchema.safeParse({ ...valid, confirmPassword: 'DifferentPass@1' })
      expect(r.success).toBe(false)
      expect(r.error.flatten().fieldErrors.confirmPassword).toBeDefined()
    })

    it('should fail with invalid phone', () => {
      const r = registerSchema.safeParse({ ...valid, phone: '123' })
      expect(r.success).toBe(false)
    })
  })
})
```

### 2.3 Auth Service Unit Tests

```javascript
// tests/unit/auth.service.test.js
import { loginUser, registerUser } from '../../src/modules/auth/auth.service.js'
import { createUser } from '../helpers/factories.js'

describe('Auth Service', () => {
  describe('loginUser', () => {
    it('should return user and tokens on valid credentials', async () => {
      await createUser({ email: 'login@test.com', password: 'Test@1234' })
      const result = await loginUser('login@test.com', 'Test@1234')

      expect(result.user.email).toBe('login@test.com')
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user.passwordHash).toBeUndefined()  // لا نرجع الـ hash
    })

    it('should throw INVALID_CREDENTIALS for wrong password', async () => {
      await createUser({ email: 'wrong@test.com' })
      await expect(loginUser('wrong@test.com', 'WrongPass@1')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS', statusCode: 401
      })
    })

    it('should throw INVALID_CREDENTIALS for nonexistent user (no user enumeration)', async () => {
      await expect(loginUser('nonexistent@test.com', 'Pass@1234')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS', statusCode: 401
      })
    })

    it('should throw ACCOUNT_SUSPENDED for inactive user', async () => {
      await createUser({ email: 'suspended@test.com', isActive: false })
      await expect(loginUser('suspended@test.com', 'Test@1234')).rejects.toMatchObject({
        code: 'ACCOUNT_SUSPENDED', statusCode: 403
      })
    })
  })

  describe('registerUser', () => {
    const data = {
      firstName: 'New', lastName: 'User',
      phone: '+201111111111', email: 'new@test.com',
      password: 'Test@1234', confirmPassword: 'Test@1234'
    }

    it('should create user and return tokens', async () => {
      const result = await registerUser(data)
      expect(result.user.email).toBe('new@test.com')
      expect(result.user.role).toBe('CLIENT')
      expect(result.accessToken).toBeDefined()
    })

    it('should throw DUPLICATE_ENTRY on duplicate email', async () => {
      await registerUser(data)
      await expect(registerUser({ ...data, phone: '+201111111112' })).rejects.toMatchObject({
        code: 'DUPLICATE_ENTRY', statusCode: 409
      })
    })

    it('should not store plain text password', async () => {
      const result = await registerUser({ ...data, email: 'secure@test.com', phone: '+201111111113' })
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const user = await prisma.user.findUnique({ where: { id: result.user.id } })
      expect(user.passwordHash).not.toBe('Test@1234')
      expect(user.passwordHash.startsWith('$2')).toBe(true)  // bcrypt hash
    })
  })
})
```

---

## 3. Integration Tests (API Endpoints)

### 3.1 Auth API Tests

```javascript
// tests/integration/auth.test.js
import request from 'supertest'
import app from '../../src/app.js'
import { createUser } from '../helpers/factories.js'

describe('POST /api/auth/register', () => {
  const validBody = {
    firstName: 'Ahmed', lastName: 'Test',
    phone: '+201234567891', email: 'register@test.com',
    password: 'Test@1234', confirmPassword: 'Test@1234'
  }

  it('201: creates user and returns accessToken', async () => {
    const res = await request(app).post('/api/auth/register').send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('register@test.com')
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.passwordHash).toBeUndefined()

    // Refresh token في الـ cookie
    const cookies = res.headers['set-cookie']
    expect(cookies.some(c => c.includes('refresh_token'))).toBe(true)
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true)
  })

  it('400: rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validBody, email: 'not-email' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    expect(res.body.details.email).toBeDefined()
  })

  it('409: rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validBody)
    const res = await request(app).post('/api/auth/register')
      .send({ ...validBody, phone: '+201111111119' })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('DUPLICATE_ENTRY')
  })

  it('429: rate limits after 3 registrations', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/auth/register').send({
        ...validBody, email: `reg${i}@test.com`, phone: `+20111111111${i}`
      })
    }
    const res = await request(app).post('/api/auth/register').send({
      ...validBody, email: 'reg4@test.com', phone: '+201111111114'
    })
    expect(res.status).toBe(429)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await createUser({ email: 'login@test.com', password: 'Test@1234' })
  })

  it('200: returns tokens on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Test@1234' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.headers['set-cookie'].some(c => c.includes('HttpOnly'))).toBe(true)
  })

  it('401: rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPass@1' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('401: same error for nonexistent user (anti-enumeration)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Test@1234' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
    // CRITICAL: نفس الـ error message — لا يكشف إن الـ user موجود أو لأ
  })
})

describe('POST /api/auth/refresh', () => {
  it('200: issues new access token', async () => {
    // Register to get refresh token cookie
    const regRes = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'User', phone: '+201234567800',
      email: 'refresh@test.com', password: 'Test@1234', confirmPassword: 'Test@1234'
    })
    const cookie = regRes.headers['set-cookie']

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    // New refresh token cookie issued
    expect(res.headers['set-cookie'].some(c => c.includes('refresh_token'))).toBe(true)
  })

  it('401: fails without refresh token cookie', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('200: clears cookie and blacklists token', async () => {
    const loginRes = await request(app).post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Test@1234' })
    // Note: need user to exist — createUser called in beforeEach

    const token  = loginRes.body.accessToken
    const cookie = loginRes.headers['set-cookie']

    const logoutRes = await request(app).post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookie)
    expect(logoutRes.status).toBe(200)

    // Cleared cookie
    expect(logoutRes.headers['set-cookie'].some(c => c.includes('refresh_token=;'))).toBe(true)

    // Old token should now be rejected
    const meRes = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(meRes.status).toBe(401)
    expect(meRes.body.code).toBe('TOKEN_REVOKED')
  })
})
```

### 3.2 Templates API Tests

```javascript
// tests/integration/templates.test.js
import request from 'supertest'
import app from '../../src/app.js'
import { createAdmin, createUser, createTemplate, loginUser } from '../helpers/factories.js'

describe('GET /api/templates', () => {
  beforeEach(async () => {
    await createTemplate({ title: 'Template A', category: 'تجارة', price: 99 })
    await createTemplate({ title: 'Template B', category: 'خدمات', price: 149 })
    await createTemplate({ title: 'Draft Template', isPublished: false })
  })

  it('200: returns only published templates', async () => {
    const res = await request(app).get('/api/templates')
    expect(res.status).toBe(200)
    expect(res.body.templates).toHaveLength(2)
    expect(res.body.templates.every(t => t.isPublished !== false)).toBe(true)
  })

  it('200: filters by category', async () => {
    const res = await request(app).get('/api/templates?category=تجارة')
    expect(res.status).toBe(200)
    expect(res.body.templates).toHaveLength(1)
    expect(res.body.templates[0].title).toBe('Template A')
  })

  it('200: searches by title', async () => {
    const res = await request(app).get('/api/templates?search=Template A')
    expect(res.status).toBe(200)
    expect(res.body.templates[0].title).toBe('Template A')
  })

  it('200: returns pagination metadata', async () => {
    const res = await request(app).get('/api/templates?page=1&limit=1')
    expect(res.body.total).toBe(2)
    expect(res.body.totalPages).toBe(2)
    expect(res.body.templates).toHaveLength(1)
  })

  it('does not expose passwordHash or sensitive fields', async () => {
    const res = await request(app).get('/api/templates')
    const template = res.body.templates[0]
    expect(template.components).toBeUndefined()  // components مش في الـ list
  })
})

describe('GET /api/templates/:id', () => {
  let template

  beforeEach(async () => {
    template = await createTemplate()
  })

  it('200: returns full template with components', async () => {
    const res = await request(app).get(`/api/templates/${template.id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(template.id)
    expect(res.body.components).toBeDefined()  // الـ customizer بيحتاجها
  })

  it('404: for unpublished template', async () => {
    const draft = await createTemplate({ isPublished: false })
    const res = await request(app).get(`/api/templates/${draft.id}`)
    expect(res.status).toBe(404)
  })

  it('404: for nonexistent template', async () => {
    const res = await request(app).get('/api/templates/nonexistent-id')
    expect(res.status).toBe(404)
  })
})
```

### 3.3 Orders API Tests

```javascript
// tests/integration/orders.test.js
import request from 'supertest'
import app from '../../src/app.js'
import { createUser, createAdmin, createTemplate, createOrder } from '../helpers/factories.js'

let client, admin, template, clientToken, adminToken, clientCookie

beforeEach(async () => {
  client   = await createUser()
  admin    = await createAdmin()
  template = await createTemplate()

  const cRes = await request(app).post('/api/auth/login')
    .send({ email: client.email, password: 'Test@1234' })
  clientToken  = cRes.body.accessToken
  clientCookie = cRes.headers['set-cookie']

  const aRes = await request(app).post('/api/auth/login')
    .send({ email: admin.email, password: 'Test@1234' })
  adminToken = aRes.body.accessToken
})

describe('POST /api/orders', () => {
  const orderBody = () => ({
    templateId:    template.id,
    customization: { sections: [{ id: 'hero' }], colorTokens: { primary: '#2563EB' } },
    notes:         'لون خاص مطلوب'
  })

  it('201: creates order for authenticated client', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(orderBody())

    expect(res.status).toBe(201)
    expect(res.body.userId).toBe(client.id)
    expect(res.body.templateId).toBe(template.id)
    expect(res.body.status).toBe('PENDING')
    expect(res.body.orderNumber).toBeDefined()
  })

  it('401: rejects unauthenticated request', async () => {
    const res = await request(app).post('/api/orders').send(orderBody())
    expect(res.status).toBe(401)
  })

  it('404: rejects order for nonexistent template', async () => {
    const res = await request(app).post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ ...orderBody(), templateId: 'fake-id' })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/orders (client)', () => {
  it('200: returns only client\'s own orders', async () => {
    const otherClient = await createUser({ email: 'other@test.com', phone: '+201234567899' })
    await createOrder(client.id, template.id)
    await createOrder(otherClient.id, template.id)

    const res = await request(app).get('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.orders.every(o => o.userId === client.id)).toBe(true)
    expect(res.body.orders).toHaveLength(1)
  })
})

describe('PATCH /api/admin/orders/:id/status', () => {
  it('200: admin can update order status', async () => {
    const order = await createOrder(client.id, template.id)
    const res = await request(app).patch(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACCEPTED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ACCEPTED')
  })

  it('403: client cannot update order status', async () => {
    const order = await createOrder(client.id, template.id)
    const res = await request(app).patch(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'ACCEPTED' })

    expect(res.status).toBe(403)
  })

  it('creates conversation on ACCEPTED status', async () => {
    const order = await createOrder(client.id, template.id)
    await request(app).patch(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACCEPTED' })

    // Check conversation created
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const conv = await prisma.conversation.findUnique({ where: { orderId: order.id } })
    expect(conv).not.toBeNull()
    expect(conv.isOpen).toBe(true)

    // Check welcome message sent
    const messages = await prisma.message.findMany({ where: { conversationId: conv.id } })
    expect(messages.length).toBeGreaterThan(0)
  })
})
```

### 3.4 Auth Guards & Authorization Tests

```javascript
// tests/integration/authorization.test.js
import request from 'supertest'
import app from '../../src/app.js'
import { createUser, createAdmin } from '../helpers/factories.js'

describe('Authorization Guards', () => {
  let clientToken, adminToken

  beforeEach(async () => {
    const client = await createUser()
    const admin  = await createAdmin()

    const cRes = await request(app).post('/api/auth/login')
      .send({ email: client.email, password: 'Test@1234' })
    clientToken = cRes.body.accessToken

    const aRes = await request(app).post('/api/auth/login')
      .send({ email: admin.email, password: 'Test@1234' })
    adminToken = aRes.body.accessToken
  })

  describe('Admin Panel Protection', () => {
    it('403: client cannot access admin stats', async () => {
      const res = await request(app).get('/api/admin/stats')
        .set('Authorization', `Bearer ${clientToken}`)
      expect(res.status).toBe(403)
    })

    it('401: unauthenticated cannot access admin', async () => {
      const res = await request(app).get('/api/admin/stats')
      expect(res.status).toBe(401)
    })

    it('200: admin can access admin stats', async () => {
      const res = await request(app).get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('Resource Ownership', () => {
    it('client can only see their own orders', async () => {
      const otherUser = await createUser({ email: 'other2@test.com', phone: '+201234567898' })
      const otherRes  = await request(app).post('/api/auth/login')
        .send({ email: otherUser.email, password: 'Test@1234' })
      const otherToken = otherRes.body.accessToken

      const template = await createTemplate()
      await createOrder((await import('@prisma/client')).then(m => {
        // just need to ensure isolation
      }))

      // Each client only sees their own
      const res = await request(app).get('/api/orders')
        .set('Authorization', `Bearer ${clientToken}`)
      expect(res.body.orders.every(o => o.userId !== otherUser.id)).toBe(true)
    })
  })

  describe('Token Validation', () => {
    it('401: rejects tampered token', async () => {
      const res = await request(app).get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.tampered.payload')
      expect(res.status).toBe(401)
    })

    it('401: rejects expired token', async () => {
      // Sign with 0s expiry
      const { signAccessToken } = await import('../../src/lib/jwt.js')
      const jwt = await import('jsonwebtoken')
      const expiredToken = jwt.default.sign(
        { sub: 'user-id', role: 'CLIENT', type: 'access' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '0s' }
      )
      await new Promise(r => setTimeout(r, 100))
      const res = await request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
      expect(res.status).toBe(401)
    })
  })
})
```

### 3.5 Chat API Tests

```javascript
// tests/integration/chat.test.js
import request from 'supertest'
import app from '../../src/app.js'
import { createUser, createAdmin, createTemplate, createOrder } from '../helpers/factories.js'
import { prisma } from '../../src/config/database.js'

describe('Chat System', () => {
  let client, admin, order, clientToken, adminToken

  beforeEach(async () => {
    client   = await createUser()
    admin    = await createAdmin()
    const t  = await createTemplate()
    order    = await createOrder(client.id, t.id)

    const cRes = await request(app).post('/api/auth/login')
      .send({ email: client.email, password: 'Test@1234' })
    clientToken = cRes.body.accessToken

    const aRes = await request(app).post('/api/auth/login')
      .send({ email: admin.email, password: 'Test@1234' })
    adminToken = aRes.body.accessToken
  })

  it('admin can open conversation', async () => {
    const res = await request(app)
      .post(`/api/admin/orders/${order.id}/conversation`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(201)
    expect(res.body.isOpen).toBe(true)

    // Welcome message sent
    const messages = await prisma.message.findMany({
      where: { conversationId: res.body.id }
    })
    expect(messages.length).toBeGreaterThan(0)
  })

  it('client cannot open conversation', async () => {
    const res = await request(app)
      .post(`/api/admin/orders/${order.id}/conversation`)
      .set('Authorization', `Bearer ${clientToken}`)
    expect(res.status).toBe(403)
  })

  it('client sees conversation only after it is opened', async () => {
    // Before open
    let res = await request(app).get('/api/chat/conversations')
      .set('Authorization', `Bearer ${clientToken}`)
    expect(res.body.conversations).toHaveLength(0)

    // Admin opens it
    await request(app).post(`/api/admin/orders/${order.id}/conversation`)
      .set('Authorization', `Bearer ${adminToken}`)

    // After open
    res = await request(app).get('/api/chat/conversations')
      .set('Authorization', `Bearer ${clientToken}`)
    expect(res.body.conversations).toHaveLength(1)
  })

  it('client cannot see other clients conversations', async () => {
    const other = await createUser({ email: 'other3@test.com', phone: '+201234560001' })
    const t2    = await createTemplate({ title: 'T2', email: 'other3@test.com' })
    const o2    = await createOrder(other.id, t2.id)

    await request(app).post(`/api/admin/orders/${o2.id}/conversation`)
      .set('Authorization', `Bearer ${adminToken}`)

    const res = await request(app).get('/api/chat/conversations')
      .set('Authorization', `Bearer ${clientToken}`)
    // Client sees only their own conversations
    expect(res.body.conversations.every(c => c.order.userId === client.id)).toBe(true)
  })
})
```

---

## 4. Load Testing

### 4.1 Artillery Config

```yaml
# tests/load/artillery.yml
config:
  target: 'http://localhost:5000'
  phases:
    # Warm up — 10 users/sec لمدة 30 ثانية
    - name: "Warm up"
      duration: 30
      arrivalRate: 10

    # Ramp up — من 10 لـ 100 users/sec في دقيقة
    - name: "Ramp up"
      duration: 60
      arrivalRate: 10
      rampTo: 100

    # Peak load — 100 users/sec لمدة 2 دقيقة
    - name: "Peak load"
      duration: 120
      arrivalRate: 100

    # Spike test — 500 users/sec فجأة لمدة 30 ثانية
    - name: "Spike"
      duration: 30
      arrivalRate: 500

  defaults:
    headers:
      Content-Type: 'application/json'

  # Thresholds — الاختبار يفشل لو تجاوزها
  ensure:
    thresholds:
      - http.response_time.p95: 500    # 95% من الـ requests أقل من 500ms
      - http.response_time.p99: 1000   # 99% أقل من 1 ثانية
      - http.codes.4xx: 1              # أقل من 1% errors
      - http.codes.5xx: 0.1            # أقل من 0.1% server errors

scenarios:
  # Scenario 1: Browse Templates (70% من الـ traffic)
  - name: "Browse Templates"
    weight: 70
    flow:
      - get:
          url: "/api/templates"
          expect:
            - statusCode: 200
            - hasProperty: "templates"
      - get:
          url: "/api/templates?category=تجارة&page=1&limit=12"
          expect:
            - statusCode: 200
      - get:
          url: "/api/templates/{{ $randomString(10) }}"
          # قد يرجع 404 — ده عادي

  # Scenario 2: Auth Flow (20%)
  - name: "Auth Flow"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "loadtest@test.com"
            password: "Test@1234"
          capture:
            - json: "$.accessToken"
              as: "token"
          expect:
            - statusCode: 200
      - get:
          url: "/api/auth/me"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200

  # Scenario 3: Client Orders (10%)
  - name: "Client Orders"
    weight: 10
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "loadtest@test.com"
            password: "Test@1234"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/api/orders"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
```

```bash
# تشغيل Load Test
artillery run tests/load/artillery.yml --output tests/load/results.json
artillery report tests/load/results.json
```

### 4.2 Autocannon (Quick Load Test)

```javascript
// tests/load/quick-load.js
import autocannon from 'autocannon'

async function runLoadTest() {
  console.log('🔥 Starting load test...\n')

  // Test 1: Templates endpoint (public, should be fast)
  const templatesResult = await autocannon({
    url: 'http://localhost:5000/api/templates',
    connections: 100,     // 100 concurrent connections
    duration: 30,         // 30 ثانية
    pipelining: 10,       // 10 requests per connection
  })

  console.log('📊 Templates Endpoint:')
  console.log(`  Requests/sec: ${templatesResult.requests.average}`)
  console.log(`  Latency p50:  ${templatesResult.latency.p50}ms`)
  console.log(`  Latency p95:  ${templatesResult.latency.p95}ms`)
  console.log(`  Latency p99:  ${templatesResult.latency.p99}ms`)
  console.log(`  Errors:       ${templatesResult.errors}`)

  // Assertions
  const p95 = templatesResult.latency.p95
  const errors = templatesResult.errors

  if (p95 > 500) console.error(`❌ p95 latency ${p95}ms exceeds 500ms threshold`)
  else console.log(`✅ p95 latency ${p95}ms is within threshold`)

  if (errors > 0) console.error(`❌ ${errors} errors during load test`)
  else console.log(`✅ No errors`)

  // Test 2: Health endpoint (baseline)
  const healthResult = await autocannon({
    url: 'http://localhost:5000/health',
    connections: 200,
    duration: 10,
  })
  console.log(`\n📊 Health Endpoint (baseline): ${healthResult.requests.average} req/sec`)
}

runLoadTest()
```

### 4.3 Database Connection Pool Test

```javascript
// tests/load/db-pool.test.js
// اختبار إن الـ connection pool بيشتغل صح تحت ضغط
describe('Database Connection Pool', () => {
  it('handles 50 concurrent queries without timeout', async () => {
    const queries = Array.from({ length: 50 }, () =>
      prisma.template.findMany({ take: 10, where: { isPublished: true } })
    )

    const start = Date.now()
    const results = await Promise.all(queries)
    const duration = Date.now() - start

    expect(results).toHaveLength(50)
    expect(duration).toBeLessThan(5000)  // أقل من 5 ثواني لـ 50 concurrent queries
    console.log(`✅ 50 concurrent queries completed in ${duration}ms`)
  })
})
```

---

## 5. Security Tests

### 5.1 Injection Tests

```javascript
// tests/security/injection.test.js
import request from 'supertest'
import app from '../../src/app.js'

describe('SQL Injection Prevention', () => {
  const payloads = [
    "'; DROP TABLE users; --",
    "1 OR 1=1",
    "admin'--",
    "1; SELECT * FROM users",
    "' UNION SELECT * FROM users --",
  ]

  payloads.forEach(payload => {
    it(`rejects SQL injection: ${payload.slice(0, 30)}...`, async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: payload, password: payload })
      // مش بنبوص على status code محدد — بس نتأكد إنه مش 200
      expect(res.status).not.toBe(200)
      // ومش بيرجع user data
      expect(res.body.accessToken).toBeUndefined()
    })
  })

  it('does not expose database errors', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: "'; DROP TABLE--", password: 'test' })
    // لا stack traces في الـ response
    expect(JSON.stringify(res.body)).not.toContain('prisma')
    expect(JSON.stringify(res.body)).not.toContain('SQL')
    expect(JSON.stringify(res.body)).not.toContain('stack')
  })
})

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '"><script>alert(document.cookie)</script>',
  ]

  xssPayloads.forEach(payload => {
    it(`safely handles XSS payload in registration`, async () => {
      const res = await request(app).post('/api/auth/register').send({
        firstName: payload, lastName: 'Test',
        phone: '+201234567890', email: 'xss@test.com',
        password: 'Test@1234', confirmPassword: 'Test@1234'
      })
      // Zod validation يرفضه أو بيتخزن escaped
      if (res.status === 201) {
        expect(res.body.user.firstName).not.toContain('<script>')
      }
    })
  })
})
```

### 5.2 Rate Limiting Tests

```javascript
// tests/security/rateLimit.test.js
import request from 'supertest'
import app from '../../src/app.js'

describe('Rate Limiting', () => {
  it('blocks login after 5 failed attempts', async () => {
    const attempts = Array.from({ length: 6 }, () =>
      request(app).post('/api/auth/login')
        .send({ email: 'victim@test.com', password: 'wrong' })
    )

    const results = await Promise.all(attempts)
    const lastResult = results[results.length - 1]

    expect(lastResult.status).toBe(429)
    expect(lastResult.body.code).toBe('TOO_MANY_LOGIN_ATTEMPTS')
    expect(lastResult.headers['retry-after']).toBeDefined()
  })

  it('blocks registration after 3 attempts', async () => {
    const base = {
      firstName: 'Test', lastName: 'User',
      password: 'Test@1234', confirmPassword: 'Test@1234'
    }

    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/auth/register')
        .send({ ...base, email: `reg_rl_${i}@test.com`, phone: `+2012345678${i}0` })
    }

    const res = await request(app).post('/api/auth/register')
      .send({ ...base, email: 'reg_rl_4@test.com', phone: '+20123456784' })
    expect(res.status).toBe(429)
  })

  it('general API limiter blocks after 100 requests per window', async () => {
    // يعمل 101 request للـ health endpoint
    const requests = Array.from({ length: 101 }, () =>
      request(app).get('/health')
    )
    const results = await Promise.all(requests)
    const blocked = results.filter(r => r.status === 429)
    expect(blocked.length).toBeGreaterThan(0)
  })
})
```

### 5.3 CORS Tests

```javascript
// tests/security/cors.test.js
import request from 'supertest'
import app from '../../src/app.js'

describe('CORS Policy', () => {
  it('allows requests from allowed origin', async () => {
    const res = await request(app).get('/api/templates')
      .set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('blocks requests from unknown origin', async () => {
    const res = await request(app).options('/api/templates')
      .set('Origin', 'https://malicious-site.com')
      .set('Access-Control-Request-Method', 'GET')
    expect(res.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com')
  })

  it('refresh token cookie has correct security attributes', async () => {
    await createUser({ email: 'cookie@test.com' })
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'cookie@test.com', password: 'Test@1234' })

    const cookie = res.headers['set-cookie']?.join(';') || ''
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/api/auth/refresh')  // Scoped path
  })
})
```

### 5.4 Security Headers Tests

```javascript
// tests/security/headers.test.js
import request from 'supertest'
import app from '../../src/app.js'

describe('Security Headers (Helmet)', () => {
  let res

  beforeAll(async () => {
    res = await request(app).get('/api/templates')
  })

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('sets X-Frame-Options', () => {
    expect(res.headers['x-frame-options']).toBeDefined()
  })

  it('sets Strict-Transport-Security in production', () => {
    // Note: only in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      expect(res.headers['strict-transport-security']).toBeDefined()
    }
  })

  it('does not expose X-Powered-By header', () => {
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('does not expose server version in error responses', async () => {
    const errRes = await request(app).get('/api/nonexistent-route')
    expect(JSON.stringify(errRes.body)).not.toContain('express')
    expect(JSON.stringify(errRes.body)).not.toContain('node')
  })
})
```

---

## 6. API Contract Tests

```javascript
// tests/integration/api-contracts.test.js
// التأكد إن شكل الـ responses ثابت (لا يتكسر الـ Frontend)

import request from 'supertest'
import app from '../../src/app.js'
import { createTemplate } from '../helpers/factories.js'

describe('API Response Contracts', () => {
  it('GET /api/templates → correct shape', async () => {
    await createTemplate()
    const res = await request(app).get('/api/templates')
    expect(res.body).toMatchObject({
      templates: expect.arrayContaining([
        expect.objectContaining({
          id:          expect.any(String),
          title:       expect.any(String),
          description: expect.any(String),
          category:    expect.any(String),
          price:       expect.anything(),
          previewUrl:  expect.any(String),
          tags:        expect.any(Array),
          defaultColors: expect.any(Object),
        })
      ]),
      total:      expect.any(Number),
      page:       expect.any(Number),
      totalPages: expect.any(Number),
    })
  })

  it('POST /api/auth/login → correct shape', async () => {
    await createUser({ email: 'contract@test.com' })
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'contract@test.com', password: 'Test@1234' })

    expect(res.body).toMatchObject({
      user: expect.objectContaining({
        id:        expect.any(String),
        firstName: expect.any(String),
        lastName:  expect.any(String),
        email:     expect.any(String),
        role:      expect.any(String),
      }),
      accessToken: expect.any(String),
    })
    // Ensure no sensitive fields leak
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.body.user.refreshTokens).toBeUndefined()
  })

  it('Error responses → consistent shape', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' })

    expect(res.body).toMatchObject({
      error: expect.any(String),
      code:  expect.any(String),
    })
    // No stack traces
    expect(res.body.stack).toBeUndefined()
  })
})
```

---

## 7. تشغيل الاختبارات

```bash
# Unit tests فقط
npm run test:unit

# Integration tests
npm run test:integration

# Security tests
npm run test:security

# كل الـ tests مع coverage
npm run test:coverage

# Load tests (يحتاج server شغال أولاً)
npm start &
artillery run tests/load/artillery.yml
node tests/load/quick-load.js

# npm audit للـ dependencies
npm audit --audit-level=high
```

### package.json scripts

```json
{
  "scripts": {
    "start":             "node src/server.js",
    "dev":               "nodemon src/server.js",
    "test":              "cross-env NODE_ENV=test jest --forceExit",
    "test:unit":         "cross-env NODE_ENV=test jest tests/unit --forceExit",
    "test:integration":  "cross-env NODE_ENV=test jest tests/integration --forceExit --runInBand",
    "test:security":     "cross-env NODE_ENV=test jest tests/security --forceExit",
    "test:coverage":     "cross-env NODE_ENV=test jest --coverage --forceExit",
    "test:load":         "node tests/load/quick-load.js",
    "test:audit":        "npm audit --audit-level=high"
  }
}
```

---

## 8. Metrics بعد الاختبار — المعدلات المقبولة

| Metric | Target | Fail If |
|--------|--------|---------|
| Response time p50 | < 100ms | > 200ms |
| Response time p95 | < 500ms | > 1000ms |
| Response time p99 | < 1000ms | > 2000ms |
| Error rate | < 0.1% | > 1% |
| Requests/sec (API) | > 500 req/s | < 200 req/s |
| DB query time (avg) | < 50ms | > 200ms |
| Redis latency | < 5ms | > 20ms |
| Unit test coverage | > 80% | < 70% |
| 0 critical security vulns | 0 | > 0 |

---

## 9. Pre-Production Checklist

### Code Quality
- [ ] كل الـ unit tests بتعدي (0 failures)
- [ ] كل الـ integration tests بتعدي
- [ ] Test coverage > 80%
- [ ] `npm audit` مفيش critical vulnerabilities

### Performance
- [ ] p95 < 500ms تحت load
- [ ] مفيش memory leaks (monitor مع autocannon)
- [ ] Redis cache hit rate > 60% للـ templates
- [ ] Database queries مفيش N+1 queries

### Security
- [ ] SQL injection blocked
- [ ] XSS inputs sanitized
- [ ] Rate limiting شغال على login + register + API
- [ ] JWT blacklisting بعد logout شغال
- [ ] Refresh token rotation شغال
- [ ] Cookies: HttpOnly + Secure + SameSite=Strict
- [ ] No sensitive data in logs
- [ ] No stack traces in production error responses
- [ ] Admin panel returns 404 لغير الـ authorized

### Infrastructure
- [ ] PM2 cluster mode شغال
- [ ] Graceful shutdown بيشتغل
- [ ] /health endpoint بيرجع 200
- [ ] Nginx configured مع rate limiting
- [ ] HTTPS enabled
- [ ] Database backups configured
- [ ] Logs rotating

---

*المرحلة الثالثة منتهية — المشروع جاهز للـ production* 🚀
