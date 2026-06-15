import * as chatService from './chat.service.js'
import { getPagination } from '../../lib/pagination.js'
import { createNotification } from '../notifications/notifications.service.js'
import { NOTIFICATION_TYPES, STAFF_ROLES } from '../../lib/constants.js'
import { prisma } from '../../config/database.js'
import { sendChatNotificationEmail } from '../../lib/mailer.js'

export async function getConversation(req, res, next) {
  try {
    const orderId = req.validatedData.orderId
    const conversation = await chatService.getOrCreateConversation(orderId, req.user.id)
    res.json(conversation)
  } catch (err) { next(err) }
}

export async function getDirectConversation(req, res, next) {
  try {
    const { clientId } = req.params
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    })
    if (!client || client.role !== 'CLIENT') {
      return res.status(404).json({ message: 'العميل غير موجود' })
    }
    const conversation = await chatService.createDirectConversation(clientId)
    res.json({ conversation, client })
  } catch (err) { next(err) }
}

export async function sendMessage(req, res, next) {
  try {
    const message = await chatService.sendMessage(
      req.user.id,
      req.user.role,
      req.params.conversationId,
      req.validatedData.content
    )

    const io = req.app.get('io')
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('chat:newMessage', message)
    }

    try {
      const isStaff = STAFF_ROLES.includes(req.user.role)
      const conv = await prisma.conversation.findUnique({
        where: { id: req.params.conversationId },
        include: {
          order: {
            select: {
              userId: true,
              orderNumber: true,
              user: { select: { id: true, email: true, firstName: true, lastName: true } }
            }
          }
        }
      })
      if (conv) {
        let client
        if (conv.type === 'DIRECT') {
          client = await prisma.user.findUnique({
            where: { id: conv.clientId },
            select: { id: true, email: true, firstName: true, lastName: true }
          })
        } else {
          client = conv.order?.user
        }
        const notifyUserId = isStaff ? client?.id : req.user.id
        if (notifyUserId && notifyUserId !== req.user.id) {
          await createNotification({
            userId: notifyUserId,
            title: isStaff ? 'رسالة جديدة من الدعم' : 'رسالة جديدة من العميل',
            body: message.content.substring(0, 100),
            type: NOTIFICATION_TYPES.CHAT_MESSAGE,
            link: isStaff ? `/dashboard/chat?convId=${conv.id}` : `/x9k2-manage/panel/chat/${conv.id}`,
          })
        }
        if (isStaff && client?.email) {
          sendChatNotificationEmail(
            client.email,
            `${client.firstName} ${client.lastName}`,
            message.content,
            conv.order?.orderNumber || 'مباشر'
          ).catch(() => {})
        }
      }
    } catch (_) {}

    res.status(201).json(message)
  } catch (err) { next(err) }
}

export async function getMessages(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await chatService.getConversationMessages(
      req.params.conversationId,
      req.user.id,
      req.user.role,
      { page, limit }
    )
    res.json(result)
  } catch (err) { next(err) }
}
