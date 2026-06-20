import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createPlanSchema, updatePlanSchema, createSubscriptionSchema } from './serverPlans.schema.js'
import * as ctrl from './serverPlans.controller.js'

const router = Router()

router.get('/server-plans', ctrl.listActivePlans)

router.post('/server-subscriptions', authenticate, validate(createSubscriptionSchema), ctrl.createSubscription)
router.get('/server-subscriptions', authenticate, ctrl.listUserSubscriptions)

export default router
