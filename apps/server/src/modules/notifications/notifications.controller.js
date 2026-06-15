import { getPagination } from '../../lib/pagination.js'
import * as svc from './notifications.service.js'

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const unreadOnly = req.query.unread === 'true'
    const result = await svc.getUserNotifications(req.user.id, { page, limit, unreadOnly })
    res.json(result)
  } catch (err) { next(err) }
}

export async function markRead(req, res, next) {
  try {
    const n = await svc.markAsRead(req.user.id, req.params.id)
    if (!n) return res.status(404).json({ message: 'الإشعار غير موجود' })
    res.json(n)
  } catch (err) { next(err) }
}

export async function markAllRead(req, res, next) {
  try {
    await svc.markAllAsRead(req.user.id)
    res.json({ message: 'تم تحديد الكل كمقروء' })
  } catch (err) { next(err) }
}

export async function unreadCount(req, res, next) {
  try {
    const count = await svc.getUnreadCount(req.user.id)
    res.json({ count })
  } catch (err) { next(err) }
}
