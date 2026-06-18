import { success, created, paginated } from '../../lib/response.js'
import * as contactService from './contact.service.js'
import { getPagination } from '../../lib/pagination.js'
import { createNotification } from '../notifications/notifications.service.js'
import { NOTIFICATION_TYPES } from '../../lib/constants.js'
import { prisma } from '../../config/database.js'
import { sendContactReplyEmail } from '../../lib/mailer.js'

export async function create(req, res, next) {
  try {
    const message = await contactService.createMessage(req.validatedData)
    created(res, null, 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً')
  } catch (err) {
    next(err)
  }
}

export async function adminList(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const status = req.query.status
    const result = await contactService.getAllMessages({ page, limit, status })
    paginated(res, result.messages, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function adminGetById(req, res, next) {
  try {
    const msg = await contactService.getMessageById(req.params.id)
    success(res, msg)
  } catch (err) { next(err) }
}

export async function adminToggleRead(req, res, next) {
  try {
    const msg = await contactService.toggleRead(req.params.id)
    success(res, null, msg.isRead ? 'تم تحديد كمقروء' : 'تم تحديد كغير مقروء')
  } catch (err) { next(err) }
}

export async function adminToggleStatus(req, res, next) {
  try {
    const { status } = req.body
    const msg = await contactService.updateStatus(req.params.id, status)
    if (status === 'RESOLVED') {
      try {
        const client = await prisma.user.findUnique({ where: { email: msg.email } })
        if (client) {
          await createNotification({
            userId: client.id,
            title: 'تم حل مشكلتك',
            body: `تم حل رسالتك "${msg.subject}"`,
            type: NOTIFICATION_TYPES.CONTACT_RESOLVED,
            link: '/dashboard',
          })
        }
      } catch (_) {}
    }
    success(res, { status: msg.status }, 'تم تحديث الحالة')
  } catch (err) { next(err) }
}

export async function adminReply(req, res, next) {
  try {
    const { content } = req.body
    const reply = await contactService.addReply(req.params.id, content, true)
    const originalMsg = await contactService.getMessageById(req.params.id)
    try {
      const client = await prisma.user.findUnique({ where: { email: originalMsg.email } })
      if (client) {
        await createNotification({
          userId: client.id,
          title: 'تم الرد على رسالتك',
          body: content.substring(0, 100),
          type: NOTIFICATION_TYPES.CONTACT_REPLY,
          link: '/dashboard',
        })
      }
    } catch (_) {}
    sendContactReplyEmail(originalMsg.email, originalMsg.name, content, originalMsg.subject).catch(() => {})
    created(res, reply)
  } catch (err) { next(err) }
}

export async function adminDelete(req, res, next) {
  try {
    await contactService.deleteMessage(req.params.id)
    success(res, null, 'تم حذف الرسالة')
  } catch (err) { next(err) }
}
