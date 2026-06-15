import { prisma } from '../../config/database.js'
import { saveMessage } from './chat.service.js'
import { STAFF_ROLES } from '../../lib/constants.js'

const msgRateLimiter = new Map()

function checkMsgRateLimit(userId) {
  const now = Date.now()
  const history = (msgRateLimiter.get(userId) || []).filter(t => now - t < 60000)
  if (history.length >= 30) return false
  msgRateLimiter.set(userId, [...history, now])
  return true
}

setInterval(() => msgRateLimiter.clear(), 5 * 60 * 1000)

export function setupChatSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.userId
    if (!userId) return socket.disconnect()

    socket.join(`user:${userId}`)

    socket.on('chat:join', async (conversationId) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { order: { select: { userId: true } } }
        })
        if (!conversation) return

        const isAdmin = STAFF_ROLES.includes(socket.userRole)
        const isOwner = conversation.order.userId === userId
        if (isAdmin || isOwner) {
          socket.join(`conversation:${conversationId}`)
        }
      } catch { /* silently fail */ }
    })

    socket.on('chat:message', async (data) => {
      try {
        if (!checkMsgRateLimit(userId)) return

        const { conversationId, content } = data || {}
        if (!content?.trim() || typeof content !== 'string') return
        if (content.length > 2000) return

        const { message, ownerId } = await saveMessage(conversationId, userId, content.trim())

        io.to(`conversation:${conversationId}`).emit('chat:newMessage', message)
        if (ownerId !== userId) {
          io.to(`user:${ownerId}`).emit('chat:newMessage', message)
        }
      } catch { /* fail silently */ }
    })

    socket.on('typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return
      const room = socket.rooms?.has(`conversation:${conversationId}`)
      if (!room) return
      socket.to(`conversation:${conversationId}`).emit('typing', { userId, isTyping })
    })
  })
}
