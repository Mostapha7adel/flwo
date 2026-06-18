import { success, paginated } from '../../lib/response.js'
import { getPagination } from '../../lib/pagination.js'
import * as svc from './notifications.service.js'

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const unreadOnly = req.query.unread === 'true'
    const result = await svc.getUserNotifications(req.user.id, { page, limit, unreadOnly })
    paginated(res, result.notifications, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function markRead(req, res, next) {
  try {
    const n = await svc.markAsRead(req.user.id, req.params.id)
    if (!n) return success(res, null, 'الإشعار غير موجود', 404)
    success(res, n)
  } catch (err) { next(err) }
}

export async function markAllRead(req, res, next) {
  try {
    await svc.markAllAsRead(req.user.id)
    success(res, null, 'تم تحديد الكل كمقروء')
  } catch (err) { next(err) }
}

export async function unreadCount(req, res, next) {
  try {
    const count = await svc.getUnreadCount(req.user.id)
    success(res, { count })
  } catch (err) { next(err) }
}
