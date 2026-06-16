import { prisma } from '../../config/database.js'
import bcrypt from 'bcryptjs'
import { generateReply } from '../../lib/ai.js'
import { STAFF_ROLES } from '../../lib/constants.js'

const BOT_EMAIL = 'bot@designflow.com'

async function getBotUser() {
  let bot = await prisma.user.findUnique({ where: { email: BOT_EMAIL } })
  if (!bot) {
    bot = await prisma.user.create({
      data: {
        firstName: 'الدعم',
        lastName: 'الفني',
        email: BOT_EMAIL,
        phone: '+000000000000',
        passwordHash: await bcrypt.hash('bot-disabled-' + Date.now(), 12),
        role: 'SUPPORT',
        isActive: true,
      }
    })
  }
  return bot
}

export async function handleClientMessage(conversationId, content) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { role: true } } }
      }
    }
  })
  if (!conversation) return null

  const hasAdminReply = conversation.messages.some(m =>
    m.sender && STAFF_ROLES.includes(m.sender.role)
  )
  if (hasAdminReply) return null

  await new Promise(r => setTimeout(r, 1000))

  const replyText = await generateReply({
    messageHistory: conversation.messages.reverse().map(m => ({
      role: m.sender && STAFF_ROLES.includes(m.sender.role) ? 'assistant' : 'user',
      content: m.content,
    })),
  })

  const bot = await getBotUser()

  const message = await prisma.message.create({
    data: { conversationId, senderId: bot.id, content: replyText },
    select: {
      id: true, content: true, isRead: true, createdAt: true, conversationId: true,
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true }
      }
    }
  })

  return message
}
