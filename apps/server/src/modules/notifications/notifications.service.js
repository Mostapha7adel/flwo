import { prisma } from '../../config/database.js'

export async function createNotification({ userId, title, body, type, link }) {
  return prisma.notification.create({
    data: { userId, title, body, type, link },
  })
}

export async function getUserNotifications(userId, { page, limit, unreadOnly }) {
  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) }
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.notification.count({ where }),
  ])
  return { notifications: items, total, page, totalPages: Math.ceil(total / limit) }
}

export async function markAsRead(userId, notificationId) {
  const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } })
  if (!n) return null
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } })
}

export async function markAllAsRead(userId) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } })
}
