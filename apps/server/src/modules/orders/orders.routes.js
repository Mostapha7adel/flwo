import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { orderLimiter } from '../../middleware/rateLimiter.js'
import { createOrderSchema } from './orders.schema.js'
import * as ctrl from './orders.controller.js'

const router = Router()

router.use(authenticate)
router.post('/', orderLimiter, validate(createOrderSchema), ctrl.create)
router.get('/', ctrl.list)
router.get('/:id', ctrl.getById)
router.patch('/:id/cancel', ctrl.cancel)

export default router
