import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import * as ctrl from './fields.controller.js'

const router = Router()

router.get('/:templateId/fields', authenticate, ctrl.list)
router.post('/:templateId/fields', authenticate, requireAdmin, ctrl.create)
router.put('/fields/:id', authenticate, requireAdmin, ctrl.update)
router.delete('/fields/:id', authenticate, requireAdmin, ctrl.remove)
router.put('/:templateId/fields/reorder', authenticate, requireAdmin, ctrl.reorder)

export default router
