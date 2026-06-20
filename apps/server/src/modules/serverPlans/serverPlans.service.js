import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { STAFF_ROLES, NOTIFICATION_TYPES } from '../../lib/constants.js'

export async function getActivePlans() {
  return prisma.serverPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getAllPlans() {
  return prisma.serverPlan.findMany({ orderBy: { sortOrder: 'asc' } })
}

export async function getPlanById(id) {
  const plan = await prisma.serverPlan.findUnique({ where: { id } })
  if (!plan) throw new AppError('الباقة غير موجودة', 404, 'PLAN_NOT_FOUND')
  return plan
}

export async function createPlan(data) {
  return prisma.serverPlan.create({ data })
}

export async function updatePlan(id, data) {
  await getPlanById(id)
  return prisma.serverPlan.update({ where: { id }, data })
}

export async function deletePlan(id) {
  await getPlanById(id)
  const subs = await prisma.serverSubscription.count({ where: { planId: id, status: 'ACTIVE' } })
  if (subs > 0) throw new AppError('لا يمكن حذف باقة عليها اشتراكات نشطة', 400, 'PLAN_HAS_SUBS')
  await prisma.serverPlan.delete({ where: { id } })
}

export async function getUserSubscriptions(userId) {
  return prisma.serverSubscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createSubscription(userId, data) {
  const plan = await getPlanById(data.planId)
  if (!plan.isActive) throw new AppError('الباقة غير متاحة حالياً', 400, 'PLAN_INACTIVE')

  const existing = await prisma.serverSubscription.findFirst({
    where: { userId, planId: data.planId, status: { in: ['PENDING', 'ACTIVE'] } },
  })
  if (existing) throw new AppError('لديك اشتراك نشط أو معلق لهذه الباقة بالفعل', 409, 'DUPLICATE_SUBSCRIPTION')

  const price = data.billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice

  const sub = await prisma.serverSubscription.create({
    data: {
      userId,
      planId: data.planId,
      billingCycle: data.billingCycle,
      price,
    },
    include: { plan: true },
  })

  try {
    const staff = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true }, select: { id: true } })
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map(s => ({
          userId: s.id,
          title: 'طلب اشتراك جديد',
          body: `طلب اشتراك في باقة ${plan.name}`,
          type: NOTIFICATION_TYPES.NEW_ORDER,
          link: `/x9k2-manage/panel/server-subscriptions`,
        })),
      })
    }
  } catch (_) {}

  return sub
}

export async function getAllSubscriptions({ page = 1, limit = 20 }) {
  const [subscriptions, total] = await Promise.all([
    prisma.serverSubscription.findMany({
      include: { plan: true, user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.serverSubscription.count(),
  ])
  return { subscriptions, total, page, totalPages: Math.ceil(total / limit) }
}

export async function updateSubscription(id, data) {
  const sub = await prisma.serverSubscription.findUnique({
    where: { id },
    include: { plan: true, user: true },
  })
  if (!sub) throw new AppError('الاشتراك غير موجود', 404, 'SUBSCRIPTION_NOT_FOUND')

  return prisma.serverSubscription.update({
    where: { id },
    data: {
      status: data.status || sub.status,
      adminNotes: data.adminNotes ?? sub.adminNotes,
    },
    include: { plan: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  })
}
