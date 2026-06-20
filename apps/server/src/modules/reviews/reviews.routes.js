import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createReviewSchema } from './reviews.schema.js'
import * as ctrl from './reviews.controller.js'

const router = Router()

router.get('/:templateId/reviews', ctrl.list)
router.get('/:templateId/reviews/stats', ctrl.stats)
router.post('/:templateId/reviews', authenticate, validate(createReviewSchema), ctrl.create)
router.delete('/reviews/:id', authenticate, ctrl.remove)

export default router
