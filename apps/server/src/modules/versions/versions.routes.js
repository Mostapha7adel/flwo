import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createVersionSchema } from './versions.schema.js'
import * as ctrl from './versions.controller.js'

const router = Router()

router.use(authenticate)

router.get('/:templateId/versions', requireAdmin, ctrl.list)
router.get('/:templateId/versions/:id', requireAdmin, ctrl.getById)
router.post('/:templateId/versions', requireAdmin, validate(createVersionSchema), ctrl.create)
router.put('/:templateId/versions/:id/current', requireAdmin, ctrl.setCurrent)
router.delete('/:templateId/versions/:id', requireAdmin, ctrl.remove)

export default router
