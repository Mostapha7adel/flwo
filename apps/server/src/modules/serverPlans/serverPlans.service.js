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

  const active = await prisma.serverSubscription.findFirst({
    where: { userId, status: { in: ['PENDING', 'ACTIVE'] } },
    orderBy: { createdAt: 'desc' },
  })

  if (active) {
    if (active.status === 'PENDING') {
      throw new AppError('لديك طلب اشتراك معلق بالفعل', 409, 'PENDING_SUBSCRIPTION')
    }
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    if (active.endDate && active.endDate > threeDaysFromNow) {
      throw new AppError('لا يمكنك طلب اشتراك جديد إلا قبل 3 أيام من انتهاء الاشتراك الحالي أو بعده', 409, 'ACTIVE_SUBSCRIPTION')
    }
  }

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
          body: `طلب اشتراك جديد في باقة ${plan.name}`,
          type: NOTIFICATION_TYPES.NEW_ORDER,
          link: `/x9k2-manage/panel/server-subscriptions`,
        })),
      })
    }
  } catch (_) {}

  return sub
}

export async function createDirectSubscription(userId, data) {
  const plan = await getPlanById(data.planId)
  if (!plan.isActive) throw new AppError('الباقة غير متاحة حالياً', 400, 'PLAN_INACTIVE')

  const existing = await prisma.serverSubscription.findFirst({
    where: { userId, status: { in: ['PENDING', 'ACTIVE'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) {
    if (existing.status === 'PENDING') {
      throw new AppError('لديك طلب اشتراك معلق بالفعل', 409, 'PENDING_SUBSCRIPTION')
    }
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    if (existing.endDate && existing.endDate > threeDaysFromNow) {
      throw new AppError('لا يمكنك الاشتراك إلا قبل 3 أيام من انتهاء الاشتراك الحالي', 409, 'ACTIVE_SUBSCRIPTION')
    }
  }

  const price = data.billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice
  const now = new Date()
  const endDate = new Date(now.getTime() + (data.billingCycle === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000)

  const sub = await prisma.serverSubscription.create({
    data: {
      userId,
      planId: data.planId,
      billingCycle: data.billingCycle,
      price,
      status: 'ACTIVE',
      startDate: now,
      endDate,
    },
    include: { plan: true },
  })

  try {
    await prisma.notification.create({
      data: {
        userId,
        title: 'تم تفعيل اشتراكك',
        body: `تم تفعيل اشتراكك في باقة ${plan.name} لمدة ${data.billingCycle === 'YEARLY' ? 'سنة' : 'شهر'} بنجاح`,
        type: 'SUBSCRIPTION_ACTIVATED',
        link: '/dashboard/subscriptions',
      },
    })
  } catch (_) {}

  try {
    const staff = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true }, select: { id: true } })
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map(s => ({
          userId: s.id,
          title: 'اشتراك جديد (مدفوع)',
          body: `اشتراك جديد في باقة ${plan.name} من ${sub.userId}`,
          type: 'SUBSCRIPTION_PAID',
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

export async function getSubscriptionById(id) {
  const sub = await prisma.serverSubscription.findUnique({
    where: { id },
    include: {
      plan: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  })
  if (!sub) throw new AppError('الاشتراك غير موجود', 404, 'SUBSCRIPTION_NOT_FOUND')
  return sub
}

export async function updateSubscription(id, data) {
  const sub = await prisma.serverSubscription.findUnique({
    where: { id },
    include: { plan: true, user: true },
  })
  if (!sub) throw new AppError('الاشتراك غير موجود', 404, 'SUBSCRIPTION_NOT_FOUND')

  const now = new Date()
  const isExpired = sub.endDate && sub.endDate < now

  if (sub.status === 'ACTIVE' && data.status === 'ACTIVE') {
    throw new AppError('الاشتراك نشط بالفعل', 400, 'ALREADY_ACTIVE')
  }

  if (sub.status === 'ACTIVE' && data.status === 'REJECTED') {
    throw new AppError('لا يمكن رفض اشتراك نشط. يمكنك إلغاؤه فقط عند انتهاء مدته', 400, 'CANNOT_REJECT_ACTIVE')
  }

  if (sub.status === 'ACTIVE' && data.status === 'CANCELLED' && !isExpired) {
    throw new AppError('لا يمكن إلغاء اشتراك نشط قبل انتهاء مدته', 400, 'CANNOT_CANCEL_ACTIVE')
  }

  const updateData = {
    status: data.status || sub.status,
    adminNotes: data.adminNotes ?? sub.adminNotes,
  }

  if (sub.status === 'ACTIVE' && data.status === 'CANCELLED' && isExpired) {
    try {
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'تم إلغاء الاشتراك',
          body: `تم إلغاء اشتراكك في باقة ${sub.plan.name} لعدم التجديد`,
          type: 'SUBSCRIPTION_CANCELLED',
          link: '/dashboard/subscriptions',
        },
      })
    } catch (_) {}
  }

  if (data.status === 'ACTIVE' && sub.status !== 'ACTIVE') {
    updateData.startDate = now
    updateData.endDate = new Date(now.getTime() + (sub.billingCycle === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000)

    try {
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'تم قبول طلب الاشتراك',
          body: `تم تفعيل اشتراكك في باقة ${sub.plan.name}`,
          type: 'SUBSCRIPTION_ACTIVATED',
          link: '/dashboard/subscriptions',
        },
      })
    } catch (_) {}
  }

  if (data.status === 'REJECTED' && sub.status !== 'REJECTED') {
    try {
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          title: 'تم رفض طلب الاشتراك',
          body: `عذراً، تم رفض طلب اشتراكك في باقة ${sub.plan.name}${data.adminNotes ? ` — ${data.adminNotes}` : ''}`,
          type: 'SUBSCRIPTION_REJECTED',
          link: '/dashboard/subscriptions',
        },
      })
    } catch (_) {}
  }

  const updateData = {
    status: data.status || sub.status,
    adminNotes: data.adminNotes ?? sub.adminNotes,
  }

  return prisma.serverSubscription.update({
    where: { id },
    data: updateData,
    include: { plan: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  })
}

export async function getExpiringSubscriptions(daysBefore = 3) {
  const target = new Date()
  target.setDate(target.getDate() + daysBefore)
  const startOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  return prisma.serverSubscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { gte: startOfDay, lt: endOfDay },
      renewalNotificationSent: false,
    },
    include: { plan: true, user: true },
  })
}

export async function markRenewalNotified(id) {
  return prisma.serverSubscription.update({
    where: { id },
    data: { renewalNotificationSent: true },
  })
}
