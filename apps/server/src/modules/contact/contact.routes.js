import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { contactLimiter } from '../../middleware/rateLimiter.js'
import { createContactSchema } from './contact.schema.js'
import * as ctrl from './contact.controller.js'

const router = Router()

router.post('/', contactLimiter, validate(createContactSchema), ctrl.create)

export default router