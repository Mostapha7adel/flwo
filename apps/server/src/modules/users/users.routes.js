import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { uploadAvatar, validateFileContent } from '../../middleware/upload.js'
import { updateProfileSchema } from './users.schema.js'
import * as ctrl from './users.controller.js'

const router = Router()

router.use(authenticate)
router.get('/profile', ctrl.getProfile)
router.put('/profile', uploadAvatar, validateFileContent, validate(updateProfileSchema), ctrl.updateProfile)

export default router
