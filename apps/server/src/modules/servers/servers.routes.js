import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createServerSchema, updateServerSchema } from './servers.schema.js'
import * as ctrl from './servers.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', validate(createServerSchema), ctrl.create)
router.get('/:id', ctrl.getById)
router.put('/:id', validate(updateServerSchema), ctrl.update)
router.delete('/:id', ctrl.remove)

export default router
