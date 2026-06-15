import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { STAFF_ROLES, NOTIFICATION_TYPES } from '../../lib/constants.js'

export async function createMessage(data) {
  const message = await prisma.contactMessage.create({ data })

  try {
    const staff = await prisma.user.findMany({ where: { role: { in: STAFF_ROLES }, isActive: true }, select: { id: true } })
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map(s => ({
          userId: s.id,
          title: 'رسالة تواصل جديدة',
          body: `${data.name}: ${data.subject}`,
          type: NOTIFICATION_TYPES.NEW_CONTACT,
          link: '/x9k2-manage/panel/contact',
        }))
      })
    }
  } catch (_) {}

  return message
}

export async function getAllMessages({ page, limit, status }) {
  const where = status ? { status } : {}
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.contactMessage.count({ where }),
  ])
  return { messages, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getMessageById(id) {
  const msg = await prisma.contactMessage.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: 'asc' } } },
  })
  if (!msg) throw new AppError('الرسالة غير موجودة', 404, 'NOT_FOUND')
  return msg
}

export async function toggleRead(id) {
  const msg = await prisma.contactMessage.findUnique({ where: { id } })
  if (!msg) throw new AppError('الرسالة غير موجودة', 404, 'NOT_FOUND')
  return prisma.contactMessage.update({ where: { id }, data: { isRead: !msg.isRead } })
}

export async function updateStatus(id, status) {
  const msg = await prisma.contactMessage.findUnique({ where: { id } })
  if (!msg) throw new AppError('الرسالة غير موجودة', 404, 'NOT_FOUND')
  return prisma.contactMessage.update({ where: { id }, data: { status } })
}

export async function deleteMessage(id) {
  const msg = await prisma.contactMessage.findUnique({ where: { id } })
  if (!msg) throw new AppError('الرسالة غير موجودة', 404, 'NOT_FOUND')
  await prisma.contactMessage.delete({ where: { id } })
}

export async function addReply(messageId, content, isAdmin = true) {
  const msg = await prisma.contactMessage.findUnique({ where: { id: messageId } })
  if (!msg) throw new AppError('الرسالة غير موجودة', 404, 'NOT_FOUND')
  const reply = await prisma.contactReply.create({
    data: { messageId, content, isAdmin },
  })
  await prisma.contactMessage.update({ where: { id: messageId }, data: { isRead: true } })
  return prisma.contactReply.findUnique({ where: { id: reply.id } })
}