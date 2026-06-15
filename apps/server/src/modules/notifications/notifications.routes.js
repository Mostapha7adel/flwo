import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as ctrl from '../notifications/notifications.controller.js'

const router = Router()
router.use(authenticate)

router.get('/', ctrl.list)
router.get('/count', ctrl.unreadCount)
router.patch('/:id/read', ctrl.markRead)
router.patch('/read-all', ctrl.markAllRead)

export default router
