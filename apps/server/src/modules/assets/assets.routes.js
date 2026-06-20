import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import * as ctrl from './assets.controller.js'

const router = Router()

router.get('/:templateId/assets', authenticate, ctrl.list)
router.post('/:templateId/assets', authenticate, requireAdmin, ctrl.create)
router.delete('/assets/:id', authenticate, requireAdmin, ctrl.remove)

export default router
