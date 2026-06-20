import { success, created, paginated } from '../../lib/response.js'
import { logger } from '../../lib/logger.js'
import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { uploadTemplateImage, uploadMedia, uploadManifest, uploadSource, validateFileContent, toPublicUrl } from '../../middleware/upload.js'
import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js'
import { hashToken } from '../auth/auth.service.js'

import * as templatesCtrl from '../templates/templates.controller.js'
import { createTemplateSchema, updateTemplateSchema } from '../templates/templates.schema.js'
import * as serverPlansCtrl from '../serverPlans/serverPlans.controller.js'
import { createPlanSchema, updatePlanSchema, updateSubscriptionSchema } from '../serverPlans/serverPlans.schema.js'
import { loginSchema } from '../auth/auth.schema.js'
import { adminLoginLimiter, uploadLimiter } from '../../middleware/rateLimiter.js'
import { getPagination } from '../../lib/pagination.js'
import * as contactCtrl from '../contact/contact.controller.js'
import * as landingCtrl from '../landing/landing.controller.js'
import * as notificationsCtrl from '../notifications/notifications.controller.js'
import { SAFE_USER_SELECT, ROLE_HIERARCHY } from '../../lib/constants.js'
import { getLandingSchema } from '../landing/landing.schema.js'
import { userStatusSchema, userRoleSchema, orderStatusSchema, banUserSchema, setVipSchema, createAccountSchema } from './admin.schema.js'

const router = Router()

router.post('/login', adminLoginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedData
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || user.role === 'CLIENT') {
      throw new AppError('بيانات الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid || !user.isActive) {
      throw new AppError('بيانات الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
    }
    const accessToken = signAccessToken(user.id, user.role)
    const refreshToken = signRefreshToken(user.id)
    const hashedRefresh = hashToken(refreshToken)
    await prisma.refreshToken.create({
      data: { token: hashedRefresh, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
    const { passwordHash, ...safeUser } = user
    res.cookie('admin_refresh_token', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh'
    })
    success(res, { user: safeUser, accessToken })
  } catch (err) { next(err) }
})

router.use(authenticate)
const requireSupport = requireRole('ADMIN', 'SUPPORT', 'ACCOUNTS', 'SUPER_ADMIN')
const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
router.use(requireSupport)

router.get('/users', async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query)
    const where = { role: 'CLIENT' }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { ...SAFE_USER_SELECT, isVIP: true, bannedUntil: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where })
    ])
    const usersWithStats = await Promise.all(users.map(async (u) => {
      const [completed, cancelled, totalOrders] = await Promise.all([
        prisma.order.count({ where: { userId: u.id, status: 'COMPLETED' } }),
        prisma.order.count({ where: { userId: u.id, status: 'CANCELLED' } }),
        prisma.order.count({ where: { userId: u.id } }),
      ])
      return { ...u, completedOrders: completed, cancelledOrders: cancelled, totalOrders }
    }))
    paginated(res, { users: usersWithStats, total, page, totalPages: Math.ceil(total / limit) }, total, page, limit)
  } catch (err) { next(err) }
})

router.patch('/users/:id/status', validate(userStatusSchema), async (req, res, next) => {
  try {
    const { isActive } = req.validatedData
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true }
    })
    if (!target) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) {
      throw new AppError('ليس لديك صلاحية تعديل هذا الحساب', 403, 'INSUFFICIENT_PERMISSIONS')
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: SAFE_USER_SELECT
    })
    success(res, { user }, isActive ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب')
  } catch (err) { next(err) }
})

router.patch('/users/:id/role', validate(userRoleSchema), async (req, res, next) => {
  try {
    const { role } = req.validatedData
    if (req.user.role !== 'ADMIN') {
      throw new AppError('فقط الأدمن يمكنه تغيير الصلاحيات', 403, 'FORBIDDEN')
    }
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true }
    })
    if (!target) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) {
      throw new AppError('ليس لديك صلاحية تعديل هذا الحساب', 403, 'INSUFFICIENT_PERMISSIONS')
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: SAFE_USER_SELECT
    })
    success(res, { user })
  } catch (err) { next(err) }
})

router.patch('/users/:id/ban', validate(banUserSchema), async (req, res, next) => {
  try {
    const { bannedUntil } = req.validatedData
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    if (!target) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { bannedUntil: bannedUntil ? new Date(bannedUntil) : null },
      select: { ...SAFE_USER_SELECT, isVIP: true, bannedUntil: true }
    })
    success(res, { user }, bannedUntil ? 'تم حظر المستخدم' : 'تم إلغاء الحظر')
  } catch (err) { next(err) }
})

router.patch('/users/:id/vip', validate(setVipSchema), async (req, res, next) => {
  try {
    const { isVIP } = req.validatedData
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    if (!target) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVIP },
      select: { ...SAFE_USER_SELECT, isVIP: true, bannedUntil: true }
    })
    success(res, { user }, isVIP ? 'تم تعيين المستخدم كمميز' : 'تم إلغاء التميز')
  } catch (err) { next(err) }
})

router.get('/accounts', async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query)
    const staffRoles = ['SUPPORT', 'ACCOUNTS', 'ADMIN', 'SUPER_ADMIN']
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: staffRoles } },
        select: { ...SAFE_USER_SELECT, isVIP: true, bannedUntil: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where: { role: { in: staffRoles } } }),
    ])
    paginated(res, { accounts: users, total, page, totalPages: Math.ceil(total / limit) }, total, page, limit)
  } catch (err) { next(err) }
})

router.post('/accounts', requireAdmin, validate(createAccountSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.validatedData
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(role)) throw new AppError('ليس لديك صلاحية إنشاء هذا الدور', 403, 'FORBIDDEN')
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { phone }] }
    })
    if (existing) throw new AppError('البريد الإلكتروني أو رقم الهاتف موجود بالفعل', 409, 'DUPLICATE')
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { firstName, lastName, email: email.toLowerCase(), phone, passwordHash, role, isActive: true },
      select: SAFE_USER_SELECT,
    })
    created(res, { user }, 'تم إنشاء الحساب بنجاح')
  } catch (err) { next(err) }
})

router.patch('/accounts/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { isActive } = req.body
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    if (!target) throw new AppError('الحساب غير موجود', 404, 'NOT_FOUND')
    if (target.role === 'CLIENT') throw new AppError('هذا المستخدم ليس حساب موظف', 400, 'NOT_STAFF')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: SAFE_USER_SELECT,
    })
    success(res, { user }, isActive ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب')
  } catch (err) { next(err) }
})

router.patch('/accounts/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body
    const validRoles = ['SUPPORT', 'ACCOUNTS', 'ADMIN']
    if (!validRoles.includes(role)) throw new AppError('دور غير صالح', 400, 'INVALID_ROLE')
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    if (!target) throw new AppError('الحساب غير موجود', 404, 'NOT_FOUND')
    if (target.role === 'CLIENT') throw new AppError('هذا المستخدم ليس حساب موظف', 400, 'NOT_STAFF')
    if (target.role === 'SUPER_ADMIN') throw new AppError('لا يمكن تعديل دور المشرف العام', 403, 'FORBIDDEN')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role) || !allowed.includes(role)) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: SAFE_USER_SELECT,
    })
    success(res, { user }, 'تم تغيير الدور بنجاح')
  } catch (err) { next(err) }
})

router.delete('/accounts/:id', requireAdmin, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    if (!target) throw new AppError('الحساب غير موجود', 404, 'NOT_FOUND')
    if (target.role === 'CLIENT') throw new AppError('هذا المستخدم ليس حساب موظف', 400, 'NOT_STAFF')
    if (target.role === 'SUPER_ADMIN') throw new AppError('لا يمكن حذف المشرف العام', 403, 'FORBIDDEN')
    const allowed = ROLE_HIERARCHY[req.user.role] || []
    if (!allowed.includes(target.role)) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
    try {
      await prisma.message.deleteMany({ where: { senderId: req.params.id } })
      await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } })
      await prisma.notification.deleteMany({ where: { userId: req.params.id } })
      await prisma.user.delete({ where: { id: req.params.id } })
    } catch (e) {
      await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false, email: `deleted-${Date.now()}@deleted.com` } })
    }
    success(res, null, 'تم حذف الحساب')
  } catch (err) { next(err) }
})

router.get('/orders', async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query)
    const status = req.query.status
    const where = status ? { status } : {}
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: SAFE_USER_SELECT },
          template: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.order.count({ where })
    ])
    paginated(res, { orders, total, page, totalPages: Math.ceil(total / limit) }, total, page, limit)
  } catch (err) { next(err) }
})

router.patch('/orders/:id/status', validate(orderStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.validatedData
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, status: true, orderNumber: true, updatedAt: true }
    })
    success(res, order)
  } catch (err) { next(err) }
})

router.get('/stats', async (req, res, next) => {
  try {
    const [usersCount, ordersCount, templatesCount, ordersByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.template.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      })
    ])
    success(res, {
      users: usersCount,
      orders: ordersCount,
      templates: templatesCount,
      ordersByStatus: ordersByStatus.reduce((acc, cur) => {
        acc[cur.status] = cur._count
        return acc
      }, {})
    })
  } catch (err) { next(err) }
})

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: SAFE_USER_SELECT },
        template: { select: { id: true, title: true, category: true, price: true, previewUrl: true } }
      }
    })
    if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
    success(res, order)
  } catch (err) { next(err) }
})

router.get('/templates', templatesCtrl.adminList)
router.get('/templates/:id', templatesCtrl.adminGetById)
router.post('/templates', uploadLimiter, uploadTemplateImage, validateFileContent, validate(createTemplateSchema), templatesCtrl.create)
router.put('/templates/:id', uploadLimiter, uploadTemplateImage, validateFileContent, validate(updateTemplateSchema), templatesCtrl.update)
router.delete('/templates/:id', templatesCtrl.remove)
router.patch('/templates/:id/publish', templatesCtrl.publish)
router.post('/templates/:id/manifest', uploadLimiter, uploadManifest, templatesCtrl.uploadManifestFile)
router.post('/templates/:id/source', uploadLimiter, uploadSource, templatesCtrl.uploadSourceCode)

router.get('/landing', landingCtrl.getContent)

router.put('/landing', validate(z.object({}).passthrough()), async (req, res, next) => {
  try {
    const data = req.validatedData
    const ops = []
    for (const [section, content] of Object.entries(data)) {
      if (section === 'site') continue
      try {
        const schema = getLandingSchema(section)
        if (!schema) continue
        const parsed = schema.safeParse(content)
        if (!parsed.success) continue
        ops.push(prisma.landingContent.upsert({
          where: { section },
          create: { section, content: parsed.data },
          update: { content: parsed.data },
        }))
      } catch (e) {
        logger.warn('Skipping invalid section "%s": %s', section, e.message)
      }
    }
    if (ops.length) await prisma.$transaction(ops)
    success(res, null, 'تم حفظ التغييرات بنجاح')
  } catch (err) { next(err) }
})

router.post('/upload/media', uploadLimiter, uploadMedia, validateFileContent, (req, res, next) => {
  try {
    if (!req.file) throw new AppError('الملف مطلوب', 400, 'FILE_REQUIRED')
    success(res, { url: toPublicUrl(req.file.path), name: req.file.filename })
  } catch (err) { next(err) }
})

router.put('/site', async (req, res, next) => {
  try {
    const { logoUrl } = req.body
    await prisma.landingContent.upsert({
      where: { section: 'site' },
      create: { section: 'site', content: { logoUrl: logoUrl || '' } },
      update: { content: { logoUrl: logoUrl || '' } },
    })
    success(res, null, 'تم حفظ الشعار')
  } catch (err) { next(err) }
})

router.get('/orders/:id/conversation', async (req, res, next) => {
  try {
    let conversation = await prisma.conversation.findUnique({
      where: { orderId: req.params.id },
      include: {
        order: { select: { id: true, orderNumber: true, userId: true } }
      }
    })
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { orderId: req.params.id },
        include: {
          order: { select: { id: true, orderNumber: true, userId: true } }
        }
      })
    }
    success(res, conversation)
  } catch (err) { next(err) }
})

router.get('/conversations', async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query)
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        take: limit,
        skip: (page - 1) * limit,
        include: {
          order: {
            select: {
              id: true, orderNumber: true, userId: true,
              template: { select: { title: true } },
              user: { select: SAFE_USER_SELECT }
            }
          },
          client: { select: SAFE_USER_SELECT },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.conversation.count()
    ])
    paginated(res, { conversations, total, page, totalPages: Math.ceil(total / limit) }, total, page, limit)
  } catch (err) { next(err) }
})

router.get('/notifications', notificationsCtrl.list)
router.get('/notifications/count', notificationsCtrl.unreadCount)
router.patch('/notifications/:id/read', notificationsCtrl.markRead)
router.patch('/notifications/read-all', notificationsCtrl.markAllRead)

router.get('/contact', contactCtrl.adminList)
router.get('/contact/:id', contactCtrl.adminGetById)
router.post('/contact/:id/reply', validate(z.object({ content: z.string().min(1, 'محتوى الرد مطلوب') })), contactCtrl.adminReply)

// Accounting
router.get('/accounts/summary', async (req, res, next) => {
  try {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [paidOrders, pendingOrders, totalExpenses, monthExpenses, lastMonthOrders] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: firstDay } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED', createdAt: { gte: lastMonth, lt: firstDay } } }),
    ])

    const totalRevenue = Number(paidOrders._sum.totalAmount || 0)
    const pendingRevenue = Number(pendingOrders._sum.totalAmount || 0)
    const totalExpense = Number(totalExpenses._sum.amount || 0)

    success(res, {
      totalRevenue,
      totalExpenses: totalExpense,
      netProfit: totalRevenue - totalExpense,
      pendingRevenue,
      monthExpenses: Number(monthExpenses._sum.amount || 0),
      lastMonthRevenue: Number(lastMonthOrders._sum.totalAmount || 0),
      orderCounts: {
        completed: await prisma.order.count({ where: { status: 'COMPLETED' } }),
        pending: await prisma.order.count({ where: { status: 'PENDING' } }),
        inProgress: await prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
        cancelled: await prisma.order.count({ where: { status: 'CANCELLED' } }),
      },
    })
  } catch (err) { next(err) }
})

router.get('/accounts/expenses', async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query)
    const category = req.query.category
    const from = req.query.from ? new Date(req.query.from) : null
    const to = req.query.to ? new Date(req.query.to) : null

    const where = {}
    if (category) where.category = category
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from
      if (to) where.date.lte = to
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.expense.count({ where }),
    ])

    const totalAmount = await prisma.expense.aggregate({ _sum: { amount: true }, where })

    success(res, {
      expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalAmount: Number(totalAmount._sum.amount || 0),
    })
  } catch (err) { next(err) }
})

router.post('/accounts/expenses', validate(z.object({
  description: z.string().min(1).max(300),
  amount: z.number().positive(),
  category: z.string().min(1).max(50),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
})), async (req, res, next) => {
  try {
    const d = req.validatedData
    const expense = await prisma.expense.create({
      data: {
        description: d.description,
        amount: d.amount,
        category: d.category,
        date: d.date ? new Date(d.date) : new Date(),
        notes: d.notes || null,
        createdBy: req.user.firstName + ' ' + req.user.lastName,
      },
    })
    success(res, { ...expense, amount: Number(expense.amount) })
  } catch (err) { next(err) }
})

router.put('/accounts/expenses/:id', validate(z.object({
  description: z.string().min(1).max(300).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).max(50).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
})), async (req, res, next) => {
  try {
    const d = req.validatedData
    const updateData = {}
    if (d.description !== undefined) updateData.description = d.description
    if (d.amount !== undefined) updateData.amount = d.amount
    if (d.category !== undefined) updateData.category = d.category
    if (d.date !== undefined) updateData.date = new Date(d.date)
    if (d.notes !== undefined) updateData.notes = d.notes

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: updateData,
    })
    success(res, { ...expense, amount: Number(expense.amount) })
  } catch (err) { next(err) }
})

router.delete('/accounts/expenses/:id', async (req, res, next) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } })
    success(res, null, 'تم حذف المصروف')
  } catch (err) { next(err) }
})

// Revenue breakdown by month
router.get('/accounts/revenue-history', async (req, res, next) => {
  try {
    const months = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM("totalAmount")::float as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE status = 'COMPLETED'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
      LIMIT 12
    `
    success(res, months)
  } catch (err) { next(err) }
})
router.patch('/contact/:id/read', contactCtrl.adminToggleRead)
router.patch('/contact/:id/status', contactCtrl.adminToggleStatus)
router.delete('/contact/:id', contactCtrl.adminDelete)

router.get('/server-plans', requireAdmin, serverPlansCtrl.getAllPlans)
router.get('/server-plans/:id', requireAdmin, serverPlansCtrl.getPlanById)
router.post('/server-plans', requireAdmin, validate(createPlanSchema), serverPlansCtrl.createPlan)
router.put('/server-plans/:id', requireAdmin, validate(updatePlanSchema), serverPlansCtrl.updatePlan)
router.delete('/server-plans/:id', requireAdmin, serverPlansCtrl.deletePlan)

router.get('/server-subscriptions', requireAdmin, serverPlansCtrl.getAllSubscriptions)
router.patch('/server-subscriptions/:id', requireAdmin, validate(updateSubscriptionSchema), serverPlansCtrl.updateSubscription)

export default router
