import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createDeploymentSchema } from './deployments.schema.js'
import * as ctrl from './deployments.controller.js'

const router = Router()

router.use(authenticate)

router.get('/:orderId/deployment', ctrl.getStatus)
router.post('/:orderId/deployment', validate(createDeploymentSchema), ctrl.create)
router.post('/:orderId/deployment/trigger', requireAdmin, ctrl.trigger)
router.get('/:orderId/deployment/log', ctrl.getLog)

export default router
