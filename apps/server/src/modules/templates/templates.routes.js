import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createTemplateSchema } from './templates.schema.js'
import * as ctrl from './templates.controller.js'

const router = Router()

router.get('/', ctrl.listPublished)
router.get('/:id', ctrl.getById)
router.get('/:id/preview', ctrl.getPreview)

export default router
