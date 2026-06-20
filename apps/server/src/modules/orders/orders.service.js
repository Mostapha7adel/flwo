import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { randomUUID } from 'crypto'
import { sendEmail, ORDER_CONFIRMED } from '../../lib/email.js'
import { STAFF_ROLES, NOTIFICATION_TYPES } from '../../lib/constants.js'

const PAGE_PRICE = 150

export async function createOrder(userId, data) {
  const template = await prisma.template.findUnique({
    where: { id: data.templateId, isPublished: true }
  })
  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  const existingOrder = await prisma.order.findFirst({
    where: { userId, templateId: data.templateId, status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } }
  })
  if (existingOrder) {
    throw new AppError('لديك طلب نشط لهذا القالب بالفعل. يمكنك إلغاء الطلب الحالي أولاً أو انتظار اكتماله.', 409, 'DUPLICATE_ORDER')
  }

  const basePrice = parseFloat(template.price.toString())
  const additionalPrice = (data.additionalPages || 0) * PAGE_PRICE
  const totalAmount = basePrice + additionalPrice

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
      userId,
      templateId: data.templateId,
      totalAmount,
      status: 'PENDING',
      notes: data.notes,
      customization: {
        colors: data.colors,
        theme: data.theme,
        additionalPages: data.additionalPages,
        requirements: data.requirements || {},
      },
    },
    include: {
      template: { select: { title: true, previewUrl: true } },
      user: { select: { email: true, firstName: true } }
    }
  })

  await sendEmail(order.user.email, ORDER_CONFIRMED(order))

  try {
    const staff = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true }, select: { id: true } })
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map(s => ({
          userId: s.id,
          title: 'طلب جديد',
          body: `طلب جديد #${order.orderNumber} من ${order.user.firstName}`,
          type: NOTIFICATION_TYPES.NEW_ORDER,
          link: `/x9k2-manage/panel/orders/${order.id}`,
        }))
      })
    }
  } catch (_) {}

  return order
}

export async function getUserOrders(userId, { page = 1, limit = 10 }) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        template: { select: { title: true, previewUrl: true, category: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where: { userId } })
  ])
  return { orders, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getOrderById(orderId, userId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      template: true,
      conversation: { include: { messages: { take: 50, orderBy: { createdAt: 'asc' } } } }
    }
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  return order
}

export async function cancelOrder(orderId, userId) {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, userId, status: { in: ['PENDING', 'ACCEPTED'] } },
    data: { status: 'CANCELLED' }
  })
  if (updated.count === 0) {
    const exists = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true } })
    if (!exists) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
    throw new AppError('لا يمكن إلغاء الطلب في هذه المرحلة', 400, 'CANNOT_CANCEL')
  }
  return prisma.order.findUnique({ where: { id: orderId } })
}
