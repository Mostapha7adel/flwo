import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { SAFE_USER_SELECT, STAFF_ROLES } from '../../lib/constants.js'

function canAccess(userId, role, ownerId, clientId) {
  return STAFF_ROLES.includes(role) || userId === ownerId || userId === clientId
}

const MSG_SELECT = {
  id: true, content: true, isRead: true, createdAt: true, conversationId: true,
  sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
}

const CONV_SELECT = {
  id: true, type: true, title: true, isOpen: true, createdAt: true, updatedAt: true,
  order: { select: { id: true, orderNumber: true, template: { select: { title: true } } } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 }
}

export async function getOrCreateConversation(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true }
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('لا تملك صلاحية الوصول', 403, 'FORBIDDEN')

  let conversation = await prisma.conversation.findUnique({
    where: { orderId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } }
  })
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { orderId, type: 'ORDER', title: `طلب #${order.orderNumber}` },
      include: { messages: { take: 0 } }
    })
  }
  return conversation
}

export async function createDirectConversation(clientId, title) {
  return prisma.conversation.create({
    data: { clientId, type: 'DIRECT', title: title || 'محادثة جديدة' },
    include: { messages: { take: 0 } }
  })
}

export async function getClientConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { order: { userId } },
        { clientId: userId, type: 'DIRECT' }
      ]
    },
    select: {
      ...CONV_SELECT,
      order: { select: { id: true, orderNumber: true, template: { select: { title: true } } } }
    },
    orderBy: { updatedAt: 'desc' }
  })
  return conversations
}

export async function sendMessage(userId, role, conversationId, content) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { order: { select: { userId: true } } }
  })
  if (!conversation) throw new AppError('المحادثة غير موجودة', 404, 'CONVERSATION_NOT_FOUND')
  const ownerId = conversation.order?.userId
  if (!canAccess(userId, role, ownerId, conversation.clientId)) {
    throw new AppError('لا تملك صلاحية الوصول لهذه المحادثة', 403, 'FORBIDDEN')
  }
  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, content },
    select: MSG_SELECT,
  })
  return message
}

export async function saveMessage(conversationId, senderId, content) {
  const [conv, sender] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { order: { select: { userId: true } } }
    }),
    prisma.user.findUnique({
      where: { id: senderId },
      select: { role: true }
    })
  ])
  if (!conv?.isOpen) throw new AppError('المحادثة مغلقة أو غير موجودة', 403, 'CONVERSATION_CLOSED')

  const isAdmin = STAFF_ROLES.includes(sender?.role)
  const ownerId = conv.order?.userId
  const isOwner = ownerId === senderId
  const isClient = conv.clientId === senderId
  if (!isAdmin && !isOwner && !isClient) {
    throw new AppError('ليس لديك صلاحية الإرسال', 403, 'FORBIDDEN')
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
    select: MSG_SELECT,
  })
  return { message, ownerId: ownerId || conv.clientId }
}

export async function getConversationMessages(conversationId, userId, role, { page = 1, limit = 50 }) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { order: { select: { userId: true } } }
  })
  if (!conversation) throw new AppError('المحادثة غير موجودة', 404, 'CONVERSATION_NOT_FOUND')
  const ownerId = conversation.order?.userId
  if (!canAccess(userId, role, ownerId, conversation.clientId)) {
    throw new AppError('لا تملك صلاحية الوصول لهذه المحادثة', 403, 'FORBIDDEN')
  }
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      select: MSG_SELECT,
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.message.count({ where: { conversationId } })
  ])
  return { messages, total, page, totalPages: Math.ceil(total / limit) }
}
